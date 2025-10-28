package io.ratsnake.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class LanguageProcessor {
    private static final ObjectMapper mapper;

    static {
        mapper = new ObjectMapper();
        mapper.enable(SerializationFeature.INDENT_OUTPUT);
//        mapper.setVisibility(PropertyAccessor.FIELD, JsonAutoDetect.Visibility.ANY);
//        mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
    }

    public static String removeCodeFences(String code) {
        if (code == null || code.isEmpty()) {
            return code;
        }
        // Remove triple backticks and any language specifier
        return code.replaceAll("(?s)```\\w*\\s*", "").replaceAll("(?s)```", "");
    }

    public static String jsonify(Object obj) throws JsonProcessingException {
        return mapper.writeValueAsString(obj);
    }

    public static String safeJsonify(Object obj) {
        try {
            return jsonify(obj);
        } catch (JsonProcessingException e) {
            System.err.println("JSON serialization error: " + e.getMessage() + ". Returning empty JSON object.");
            return "{}";
        }
    }

    public static <T> T parseJson(String json, Class<T> clazz) throws JsonProcessingException {
        return mapper.readValue(json, clazz);
    }

    public static <T> T parseJson(String json, TypeReference<T> typeRef) throws JsonProcessingException {
        return mapper.readValue(json, typeRef);
    }

    public static <T> T safeParseJson(String json, Class<T> clazz) throws JsonProcessingException {
        String cleanedJson = removeCodeFences(json);
        return parseJson(cleanedJson, clazz);
    }

    public static <T> T safeParseJson(String json, TypeReference<T> typeRef) throws JsonProcessingException {
        String cleanedJson = removeCodeFences(json);
        return parseJson(cleanedJson, typeRef);
    }
}
