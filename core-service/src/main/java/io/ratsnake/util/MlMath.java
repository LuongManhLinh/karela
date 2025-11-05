package io.ratsnake.util;

public class MlMath {
    public static double cosineSimilarity(float[] vecA, float[] vecB) {
        if (vecA.length != vecB.length) {
            throw new IllegalArgumentException("Vectors must be of the same length");
        }

        float dotProduct = 0.0f;
        float normA = 0.0f;
        float normB = 0.0f;

        for (int i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA == 0.0f || normB == 0.0f) {
            return 0.0f; // Avoid division by zero
        }

        return dotProduct / ((Math.sqrt(normA) * Math.sqrt(normB)));
    }

    public static double cosineSimilarity(double[] vecA, double[] vecB) {
        if (vecA.length != vecB.length) {
            throw new IllegalArgumentException("Vectors must be of the same length");
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0; // Avoid division by zero
        }

        return dotProduct / ((Math.sqrt(normA) * Math.sqrt(normB)));
    }

    public static double cosineSimilarity(Float[] vecA, Float[] vecB) {
        if (vecA.length != vecB.length) {
            throw new IllegalArgumentException("Vectors must be of the same length");
        }

        float dotProduct = 0.0f;
        float normA = 0.0f;
        float normB = 0.0f;

        for (int i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA == 0.0f || normB == 0.0f) {
            return 0.0f; // Avoid division by zero
        }

        return dotProduct / ((Math.sqrt(normA) * Math.sqrt(normB)));
    }

    public static double cosineSimilarity(Double[] vecA, Double[] vecB) {
        if (vecA.length != vecB.length) {
            throw new IllegalArgumentException("Vectors must be of the same length");
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0; // Avoid division by zero
        }

        return dotProduct / ((Math.sqrt(normA) * Math.sqrt(normB)));
    }
}
