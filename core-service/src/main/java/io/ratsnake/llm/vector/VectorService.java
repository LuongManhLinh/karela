package io.ratsnake.llm.vector;

import java.util.List;

public interface VectorService {
    String COLLECTION = "Ratsnake";
    String DOC_ID = "docId";
    String TEXT = "text";

    void insert(String id, String text);
    List<String> search(String text, int topK);
    List<List<String>> cluster(float epsilon, int minPoints);
}
