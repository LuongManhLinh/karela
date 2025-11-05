package io.ratsnake.llm.vector;

import com.google.gson.annotations.SerializedName;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import elki.data.NumberVector;
import elki.data.type.TypeUtil;
import elki.database.StaticArrayDatabase;
import elki.database.relation.Relation;
import elki.datasource.ArrayAdapterDatabaseConnection;
import elki.distance.CosineDistance;
import elki.distance.Distance;
import io.weaviate.client.Config;
import io.weaviate.client.WeaviateClient;
import io.weaviate.client.v1.graphql.query.argument.NearVectorArgument;
import io.weaviate.client.v1.graphql.query.fields.Field;
import io.weaviate.client.v1.schema.model.Property;
import io.weaviate.client.v1.schema.model.WeaviateClass;
import lombok.Data;
import org.apache.commons.math3.ml.clustering.DBSCANClusterer;
import smile.clustering.DBSCAN;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.ratsnake.util.LanguageProcessor.jsonify;
import static io.ratsnake.util.LanguageProcessor.safeJsonify;


public class WeaviateService implements VectorService {
    @Data
    private static class Additional {
        private String id;
        private double[] vector;
    }

    @Data
    private static class Doc {
        private String docId;
        private String text;
        private Additional _additional;
    }

    @Data
    private static class Docs {
        @SerializedName(COLLECTION)
        private List<Doc> docs;
    }

    private static final Field DOC_ID_FIELD = Field.builder().name(DOC_ID).build();
    private static final Field TEXT_FIELD = Field.builder().name(TEXT).build();
    private static final Field ADDITIONAL_FIELD = Field.builder()
            .name("_additional")
            .fields(
                    Field.builder().name("id").build(),
                    Field.builder().name("vector").build()
            )
            .build();

    private final WeaviateClient client;
    private final EmbeddingModel embeddingModel;

    public WeaviateService(String host, int port, EmbeddingModel embeddingModel) throws Exception {
        Config cfg = new Config("http", host + ":" + port);
        this.client = new WeaviateClient(cfg);
        this.embeddingModel = embeddingModel;

        createClass(COLLECTION);
    }

    private Float[] embed(String text) {
        float[] embedding = embeddingModel.embed(text).content().vector();
        Float[] vector = new Float[embedding.length];
        for (int i = 0; i < embedding.length; i++) {
            vector[i] = embedding[i];
        }
        return vector;
    }

    private void createClass(String className) throws Exception {
        WeaviateClass doc = WeaviateClass.builder()
                .className(className)
                .properties(List.of(
                        Property.builder().name(DOC_ID).dataType(List.of("text")).build(),
                        Property.builder().name(TEXT).dataType(List.of("text")).build()
                ))
                .build();

        var res = client.schema().classCreator().withClass(doc).run();
        if (res.hasErrors()) {
            if (res.getError().getStatusCode() == 422) {
                System.err.println("Class " + className + " already exists. Creation skipped.");
            } else {
                throw new RuntimeException("Create class failed: " + res.getError().getMessages());
            }
        } else {
            System.out.println("Class created on server: " + res.getResult()); // usually true
        }
    }

    @Override
    public void insert(String id, String text) {
        Map<String, Object> props = Map.of(
                DOC_ID, id,
                TEXT, text
        );
        client.data().creator()
                .withClassName(COLLECTION)
                .withProperties(props)
                .withVector(embed(text))
                .run();
    }

    @Override
    public List<String> search(String text, int topK) {
        NearVectorArgument near = NearVectorArgument.builder()
                .vector(embed(text))
                .distance(0.8f)
                .build();

        var res = client.graphQL().get()
                .withClassName(COLLECTION)
                .withFields(DOC_ID_FIELD, TEXT_FIELD)
                .withNearVector(near)
                .withLimit(topK)
                .run(Docs.class);

        var docs = res.getResult().getData().getObjects().getDocs();

        System.out.println("Search results: " + docs);

        if (docs == null) {
            return List.of();
        }

        return docs.stream()
                .map(Doc::getDocId)
                .toList();
    }

    @Override
    public List<List<String>> cluster(float epsilon, int minPoints) {
        var query = client.graphQL().get()
                .withClassName(COLLECTION)
                .withFields(DOC_ID_FIELD, TEXT_FIELD, ADDITIONAL_FIELD)
                .run(Docs.class);

        var queryData = query.getResult().getData();
        if (queryData == null) {
            System.out.println("No data found for clustering.");
            return List.of();
        }

        var docs = queryData.getObjects().getDocs();
        if (docs == null || docs.isEmpty()) {
            System.out.println("No documents found for clustering.");
            return List.of();
        }

        var vectors = docs.stream()
                .map(doc -> {
                    Additional additional = doc.get_additional();
                    return additional.getVector();
                })
                .toArray(double[][]::new);

        var dbscan = DBSCAN.fit(vectors, minPoints, epsilon);
        Map<Integer, List<String>> clusterGroups = new HashMap<>();
        for (int i = 0; i < docs.size(); i++) {
            int clusterId = dbscan.group(i);
            clusterGroups.computeIfAbsent(clusterId, cid -> new ArrayList<>())
                    .add(docs.get(i).getText());
        }

        for (var entry : clusterGroups.entrySet()) {
            System.out.println("Cluster " + entry.getKey() + ":");
            for (var docText : entry.getValue()) {
                System.out.println(" - " + docText);
            }
            System.out.println();
        }


        var db = new StaticArrayDatabase(
                new ArrayAdapterDatabaseConnection(vectors),
                null
        );
        db.initialize();
        Relation<NumberVector> relation = db.getRelation(TypeUtil.NUMBER_VECTOR_FIELD);

        System.out.println(relation.getDBIDs());

        var distance = CosineDistance.STATIC;
        var elkiDbscan = new elki.clustering.dbscan.DBSCAN<>(distance, epsilon, minPoints);
        var res = elkiDbscan.run(relation);

        for (var cluster : res.getAllClusters()) {
            System.out.println(cluster.getIDs());
        }


//        System.out.println("\nCOSINE SIMILARITIES:");
//
//        // Compare cosine similarity pair-by-pair in docs
//        for (int i = 0; i < docs.size() - 1; i++) {
//            for (int j = i + 1; j < docs.size(); j++) {
//                double sim = io.ratsnake.util.MlMath.cosineSimilarity(
//                        docs.get(i).get_additional().getVector(),
//                        docs.get(j).get_additional().getVector()
//                );
//                System.out.println(docs.get(i).getText());
//                System.out.println(docs.get(j).getText());
//                System.out.printf("Cosine similarity: %.4f%n", sim);
//                System.out.println("-------------------------");
//            }
//        }
        return List.of();
    }

    public void deleteAll() throws Exception {
        var res = client.schema().classDeleter()
                .withClassName(COLLECTION)
                .run();
        if (res.hasErrors()) {
            System.err.println("Delete class failed: " + res.getError().getMessages());
        } else {
            System.out.println("Class deleted on server: " + res.getResult()); // usually true
        }

        createClass(COLLECTION);
    }

    public static void main(String[] args) throws Exception {
        var embeddingModel = GoogleAiEmbeddingModel.builder()
                .modelName("gemini-embedding-001")
                .apiKey("AIzaSyCdWrEuKbspmeVgMN3H_kJsVO8g6VQ7TLI")
                .outputDimensionality(1024)
                .build();
        var service = new WeaviateService("localhost", 8000, embeddingModel);


        try {
//            service.deleteAll();
            List<String> docs = Files.readAllLines(Path.of("external/example_text_for_vectordb"));
            for (int i = 0; i < docs.size(); i++) {
                service.insert("doc" + (i), docs.get(i));
            }
            service.cluster(0.55f, 1);
//            service.search("football player", 2);


//            var results = service.search(className, "football player", 2);
//            System.out.println("Search results: " + results);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
