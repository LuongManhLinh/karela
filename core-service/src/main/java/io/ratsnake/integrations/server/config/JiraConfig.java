package io.ratsnake.integrations.server.config;

import io.ratsnake.integrations.jira.JiraApiService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JiraConfig {
    @Bean
    public JiraApiService jiraApiService() {
        return new JiraApiService();
    }
}
