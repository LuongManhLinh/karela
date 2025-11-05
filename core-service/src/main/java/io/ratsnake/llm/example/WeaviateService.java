package io.ratsnake.llm.example;

import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.CosineSimilarity;
import io.weaviate.client.Config;
import io.weaviate.client.WeaviateClient;
import io.weaviate.client.base.Result;
import io.weaviate.client.v1.data.model.WeaviateObject;
import io.weaviate.client.v1.graphql.model.GraphQLResponse;
import io.weaviate.client.v1.graphql.query.argument.*;
import io.weaviate.client.v1.graphql.query.fields.Field;
import io.weaviate.client.v1.filters.Operator;
import io.weaviate.client.v1.filters.WhereFilter;
import io.weaviate.client.v1.schema.model.Property;
import io.weaviate.client.v1.schema.model.WeaviateClass;
import lombok.RequiredArgsConstructor;
import org.apache.commons.math3.ml.clustering.DoublePoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import smile.clustering.DBSCAN;
import smile.clustering.KMeans;
import org.apache.commons.math3.ml.clustering.DBSCANClusterer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class WeaviateService {
    private WeaviateClient weaviateClient;

    private final String className = "Docs_Test4";

    public void recreate() throws IOException {
        Config cfg = new Config("http", "localhost:8000");
        WeaviateClient client = new WeaviateClient(cfg);

//        WeaviateClass doc = WeaviateClass.builder()
//                .className(className)
////                .vectorizer("text2vec-google")
////                .moduleConfig(Map.of(
////                        "text2vec-google", Map.of(
////                                "modelId", "gemini-embedding-001",
////                                "projectId", "1034075071945"
////                        )
////                ))
//                .properties(List.of(
//                        Property.builder().name("docId").dataType(List.of("text")).build(),
//                        Property.builder().name("text").dataType(List.of("text")).build()
//                ))
//                .build();
//
//        Result<Boolean> created = client.schema().classCreator().withClass(doc).run();
//        if (created.hasErrors()) {
//            throw new RuntimeException("Create class failed: " + created.getError().getMessages());
//        }
//        System.out.println("Class created on server: " + created.getResult()); // usually true
//
//        System.out.println("Doc class created: " + doc);
        this.weaviateClient = client;
    }

    public void insertDoc(String docId, String text, float[] embedding) {
        Map<String, Object> props = Map.of("docId", docId, "text", text);
        Float[] vector = new Float[embedding.length];
        for (int i = 0; i < embedding.length; i++) {
            vector[i] = embedding[i];
        }
        Result<WeaviateObject> res = weaviateClient.data().creator()
                .withClassName(className)
                .withProperties(props)
                .withVector(vector)
                .run();
//        if (res.hasErrors()) throw new RuntimeException(res.getError().getMessages().toString());
        System.out.println("Inserted: " + res);
    }

    public List<List<String>> getAllClustered(Float force) {
        GroupArgument group = GroupArgument.builder()
                .type(GroupType.closest)   // or GroupType.merge
                .force(force)              // 0..1
                .build();

        Field docId = Field.builder().name("docId").build();

        var query = weaviateClient.graphQL().get()
                .withClassName(className)
                .withFields(docId)
                .withGroup(group)
                .run();

        System.out.println(query.getResult());

        return null;

    }

    public void searchByText(String query, int k) {
        Field docId = Field.builder().name("docId").build();
        Field text  = Field.builder().name("text").build();
        NearTextArgument near = NearTextArgument.builder()
                .concepts(new String[]{ query })
                .distance(0.1f)
                .build();
        var res = weaviateClient.graphQL().get()
                .withClassName(className)
                .withFields(docId, text)
                .withNearText(near)
                .withLimit(k)
                .run();
        System.out.println(res.getResult());

//        if (res.hasErrors()) throw new RuntimeException(res.getError().getMessages().toString());
    }

    public void groupIds(List<String> ids, float force) {
        GroupArgument group = GroupArgument.builder()
                .type(GroupType.closest)   // or GroupType.merge
                .force(force)              // 0..1
                .build();


        Field docId = Field.builder().name("docId").build();
        Field text  = Field.builder().name("text").build();
        Field vector = Field.builder().name("_vector").build();

        var query = weaviateClient.graphQL().get()
                .withClassName(className)
                .withFields(docId, text, vector)
//                .withWhere(where)
//                .withGroup(group)
                .run();
        System.out.println(query.getResult().getData());
    }

    public void groupId() {
        var res = weaviateClient.data().objectsGetter()
                .withClassName(className)
                .withVector()
                .withLimit(100)
                .run();
        List<WeaviateObject> objects = res.getResult();

        // 2. Extract vectors
        double[][] vectors = objects.stream()
                .map(o -> {
                    List<Double> vecList = new ArrayList<>();
                    Float[] vecObj = o.getVector();

                    for (Float v : vecObj) {
                        vecList.add(v.doubleValue());
                    }
                    return vecList;
                })
                .map(l -> l.stream().mapToDouble(Double::doubleValue).toArray())
                .toArray(double[][]::new);


//        // 3. Run K-Means clustering
//        int k = 2; // number of clusters
//        var kmeans = KMeans.fit(vectors, k, 100);
//
//        // 4. Group IDs by cluster
//        Map<Integer, List<String>> clusterGroups = new HashMap<>();
//        for (int i = 0; i < objects.size(); i++) {
//            int clusterId = kmeans.group(i);
//            clusterGroups.computeIfAbsent(clusterId, cid -> new ArrayList<>())
//                    .add(objects.get(i).getId());
//        }
//
//        // 5. Print results
//        clusterGroups.forEach((cid, ids) ->
//                System.out.println("Cluster " + cid + ": " + ids)
//        );

        int minPts = 1;
        float epsilon = 0.5f;

        for (int g = 0; g < 10; g++) {
            System.out.println((g + 1));
            epsilon += 0.005f;

            var dbscan = DBSCAN.fit(vectors, minPts, epsilon);
            System.out.println("Number of clusters: " + dbscan.k());
//        List<Integer> labels = new ArrayList<>();
//        for (int label : dbscan.group()) {
//            labels.add(label);
//        }
//        System.out.println("CLuster labels: " + labels);

/*            for (int i = 0; i < objects.size(); i++) {
                int clusterId = dbscan.group(i);
                System.out.println("Point ID: " + objects.get(i).getId() + " assigned to cluster: " + clusterId);
            }*/
        }
    }

    public void getAll() {
        Field docId = Field.builder().name("docId").build();
        Field text  = Field.builder().name("text").build();

        // Include _additional { id }
        Field additional = Field.builder()
                .name("_additional")
                .fields(
                        Field.builder().name("id").build()
                )
                .build();

        var res = weaviateClient.graphQL().get()
                .withClassName(className)
                .withFields(docId, text, additional)
                .withLimit(20)
                .run();

        System.out.println(res.getResult());
    }

    public void deleteAll() {
        Result<Boolean> res = weaviateClient.schema().allDeleter().run();
        if (res.hasErrors()) throw new RuntimeException(res.getError().getMessages().toString());
        System.out.println("All classes deleted: " + res.getResult());
    }

    public void verify() {
        var meta = weaviateClient.misc().metaGetter().run();
        System.out.println(meta.getResult());        // Should list text2vec-google among modules
        var got = weaviateClient.schema().classGetter().withClassName("Docs").run();
        System.out.println(got.getResult().getVectorizer()); // should be "text2vec-google"
    }

    public static void main(String[] args) {
        WeaviateService service = new WeaviateService();
        var embeddingModel = GoogleAiEmbeddingModel.builder()
                .modelName("gemini-embedding-001")
                .apiKey("AIzaSyCdWrEuKbspmeVgMN3H_kJsVO8g6VQ7TLI")
                .outputDimensionality(1024)
                .build();
        try {
            service.recreate();
//            service.insertDoc("doc1", "John is a great football player", embeddingModel.embed("John is a great football player").content().vector());
//            service.insertDoc("doc2", "The school closed at 5 pm yesterday", embeddingModel.embed("The school closed at 5 pm yesterday").content().vector());
//            service.insertDoc("doc3", "I have 5 courses this semester", embeddingModel.embed("I have 5 courses this semester").content().vector());
//            service.insertDoc("doc4", "The soccer match ended with the winner is team A", embeddingModel.embed("The soccer match ended with the winner is team A").content().vector());
//            String doc5 = "Lionel Messi is widely regarded as one of the greatest football players of all time.";
//            service.insertDoc("doc5", doc5, embeddingModel.embed(doc5).content().vector());
//
//            String doc6 = "Cristiano Ronaldo has won multiple Ballon d'Or awards throughout his career.";
//            service.insertDoc("doc6", doc6, embeddingModel.embed(doc6).content().vector());
//
//            String doc7 = "The Eiffel Tower is one of the most famous landmarks in Paris.";
//            service.insertDoc("doc7", doc7, embeddingModel.embed(doc7).content().vector());
//            service.groupIds(
//                    List.of("doc1", "doc2", "doc3", "doc4"), 0.3f
//            );
            service.groupId();
//            service.getAll();
//            service.searchByText("football player", 3);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
