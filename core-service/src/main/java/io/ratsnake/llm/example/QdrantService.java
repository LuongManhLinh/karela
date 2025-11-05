package io.ratsnake.llm.example;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Points.*;

import java.time.Duration;
import java.util.*;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;
import io.qdrant.client.WithPayloadSelectorFactory;
import io.qdrant.client.WithVectorsSelectorFactory;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.VectorInputFactory.vectorInput;

public class QdrantService {
    private QdrantClient client = new QdrantClient(
            QdrantGrpcClient
                    .newBuilder("localhost", 6334, false)
                    .build()
    );

    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final String collection = "test_collection";
    private final EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
            .modelName("gemini-embedding-001")
            .apiKey("AIzaSyCdWrEuKbspmeVgMN3H_kJsVO8g6VQ7TLI")
            .outputDimensionality(768)
            .build();

    public void initialize() throws Exception {
        // Create collection (cosine works well for text embeddings)
        int dim = 768;
        client.createCollectionAsync(
                collection,
                VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(dim).build(),
                TIMEOUT
        ).get();

        // (Optional but recommended) index a payload field we’ll use for grouping
        client.createPayloadIndexAsync(
                collection,
                "doc_id",
                PayloadSchemaType.Keyword,
                PayloadIndexParams.newBuilder().build(),
                true,  // wait
                WriteOrderingType.Weak,
                TIMEOUT
        ).get();
    }

    public void upsert(List<TextChunk> chunks) throws Exception {
        List<PointStruct> points = new ArrayList<>();
        for (TextChunk c : chunks) {
            float[] v = embeddingModel.embed(c.text).content().vector();// <-- plug your embedder here
            points.add(PointStruct.newBuilder()
                    .setId(id(c.id))
                    .setVectors(vectors(v)) // single unnamed vector
                    .putAllPayload(Map.of(
                            "text", value(c.text),
                            "doc_id", value(c.docId)
                    ))
                    .build());
        }

        client.upsertAsync(collection, points, TIMEOUT).get();
    }

    public List<ScoredPoint> search(String query, int limit) throws Exception {
        float[] qvec = embeddingModel.embed(query).content().vector();

        List<ScoredPoint> search = client.searchAsync(
                SearchPoints.newBuilder()
                        .setCollectionName(collection)
                        .addAllVector(floats(qvec))
                        .setLimit(limit)
                        .setWithPayload(WithPayloadSelectorFactory.enable(true))
                        .setWithVectors(WithVectorsSelectorFactory.enable(true))
                        .build(),
                TIMEOUT
        ).get();
        if (search == null) {
            search = List.of();
            System.out.println("Search returned no results");
        } else {
            System.out.println("Search results:");
            for (ScoredPoint p : search) {
                System.out.printf("id=%s score=%.4f text=%s doc=%s%n",
                        p.getId(), p.getScore(),
                        p.getPayloadMap().get("text").getStringValue(),
                        p.getPayloadMap().get("doc_id").getStringValue());
            }
        }
        return search;
    }

    public List<PointGroup> groupedSearch(String query, int groupLimit, int groupSize) throws Exception {
        float[] qvec = embeddingModel.embed(query).content().vector();

        List<PointGroup> groups = client.queryGroupsAsync(
                QueryPointGroups.newBuilder()
                        .setCollectionName(collection)
                        .setQuery(nearest(vectorInput(floats(qvec))))
                        .setGroupBy("doc_id")
                        .setLimit(groupLimit)       // max number of groups (docs)
                        .setGroupSize(groupSize)   // max hits per group
                        .setWithPayload(WithPayloadSelectorFactory.enable(true))
                        .build(),
                TIMEOUT
        ).get();

        if (groups == null) {
            groups = List.of();
            System.out.println("Grouping returned no results");
        } else {
            System.out.println("\nGrouped results (by doc_id):");
            for (PointGroup g : groups) {
                System.out.println("doc_id=" + g.getId().getStringValue());
                for (ScoredPoint p : g.getHitsList()) {
                    System.out.printf("  id=%s score=%.4f text=%s%n",
                            p.getId(), p.getScore(),
                            p.getPayloadMap().get("text").getStringValue());
                }
            }
        }
        return groups;
    }

    public void cluster() throws Exception {
        List<ScoredPoint> search = search("fast search", 10);

        int k = 2;
        List<float[]> toCluster = new ArrayList<>();
        for (ScoredPoint p : search) {
            // If you didn’t fetch vectors, do a retrieve/scroll with with_vectors=true, or keep them client-side.
            // Here we re-embed the payload text just for demo simplicity:
            String t = p.getPayloadMap().get("text").getStringValue();
            List<Float> v = p.getVectors().getVector().getDataList();
            float[] vec = new float[v.size()];
            for (int i = 0; i < v.size(); i++) vec[i] = v.get(i);
            toCluster.add(vec);
        }
        int[] labels = kmeans(toCluster, k, 20); // 20 iterations
        System.out.println("\nKMeans cluster assignments:");
        for (int i = 0; i < toCluster.size(); i++) {
            System.out.printf("point #%d -> cluster %d%n", i, labels[i]);
        }
    }


    public record TextChunk(long id, String docId, String text) {
    }

    private static List<Float> floats(float[] v) {
        List<Float> out = new ArrayList<>(v.length);
        for (float f : v) out.add(f);
        return out;
    }

    private static float[] floats(List<Float> v) {
        float[] out = new float[v.size()];
        for (int i = 0; i < v.size(); i++) out[i] = v.get(i);
        return out;
    }


    // Minimal KMeans (Euclidean) for demo purposes.
    static int[] kmeans(List<float[]> data, int k, int iters) {
        int n = data.size(), d = data.getFirst().length;
        float[][] centroids = new float[k][d];
        Random rnd = new Random(42);
        for (int i = 0; i < k; i++) centroids[i] = data.get(rnd.nextInt(n)).clone();
        int[] labels = new int[n];

        for (int it = 0; it < iters; it++) {
            // assign
            for (int i = 0; i < n; i++) {
                labels[i] = argminDist(data.get(i), centroids);
            }
            // update
            float[][] sums = new float[k][d];
            int[] counts = new int[k];
            for (int i = 0; i < n; i++) {
                int c = labels[i];
                counts[c]++;
                float[] x = data.get(i);
                for (int j = 0; j < d; j++) sums[c][j] += x[j];
            }
            for (int c = 0; c < k; c++) {
                if (counts[c] == 0) continue;
                for (int j = 0; j < d; j++) centroids[c][j] = sums[c][j] / counts[c];
            }
        }
        return labels;
    }

    static int argminDist(float[] x, float[][] cents) {
        int best = 0; double bestD = Double.POSITIVE_INFINITY;
        for (int c = 0; c < cents.length; c++) {
            double d = 0;
            for (int j = 0; j < x.length; j++) { double diff = x[j] - cents[c][j]; d += diff * diff; }
            if (d < bestD) { bestD = d; best = c; }
        }
        return best;
    }

    public static void main(String[] args) throws Exception {
        String[] texts = {
                "The cat sat on the mat.",
                "Dogs are great pets.",
                "The quick brown fox jumps over the lazy dog.",
                "Cats and dogs can be friends.",
                "A fast search algorithm improves performance.",
                "Searching quickly is important for large datasets."
        };

        List<TextChunk> chunks = new ArrayList<>();
        for (int i = 0; i < texts.length; i++) {
            chunks.add(new TextChunk(i, "doc" + i, texts[i]));
        }

        QdrantService service = new QdrantService();
        service.initialize();
        service.upsert(chunks);
        var groups = service.groupedSearch("fast search", 3, 2);
        System.out.println(groups);
        service.cluster();
    }
}


