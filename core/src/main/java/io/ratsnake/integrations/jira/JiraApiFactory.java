package io.ratsnake.integrations.jira;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import retrofit2.Retrofit;
import retrofit2.converter.jackson.JacksonConverterFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

public class JiraApiFactory {
    private static final String baseUrl;
    private static final String email;
    private static final String apiToken;

    static {
        try {
            var lines = Files.readAllLines(Path.of("external/JIRA"));
            baseUrl = lines.get(0).trim();
            email = lines.get(1).trim();
            apiToken = lines.get(2).trim();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static JiraApi create(String baseUrl, String email, String apiToken) {
        String creds = email + ":" + apiToken;
        String basic = "Basic " + Base64.getEncoder()
                .encodeToString(creds.getBytes(StandardCharsets.UTF_8));

        Interceptor auth = chain -> {
            Request req = chain.request().newBuilder()
                    .addHeader("Authorization", basic)
                    .addHeader("Accept", "application/json")
                    .build();
            return chain.proceed(req);
        };

        OkHttpClient http = new OkHttpClient.Builder()
                .addInterceptor(auth)
                .build();
        ObjectMapper mapper = JsonMapper.builder()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .build();

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(baseUrl)
                .addConverterFactory(JacksonConverterFactory.create(mapper))
                .client(http)
                .build();

        return retrofit.create(JiraApi.class);
    }

    public static JiraApi create() {
        return create(baseUrl, email, apiToken);
    }
}
