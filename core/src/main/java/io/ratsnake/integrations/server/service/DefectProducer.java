package io.ratsnake.integrations.server.service;

import io.ratsnake.integrations.data.entity.Analysis;
import io.ratsnake.integrations.data.repository.AnalysisRepository;
import io.ratsnake.integrations.server.config.RabbitMQConfig;
import io.ratsnake.integrations.server.dto.AnalysisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DefectProducer {
    @Autowired
    private final RabbitTemplate rabbitTemplate;

    @Autowired
    private final AnalysisRepository analysisRepository;

    public void startAnalysis(String projectKey, String type) {
        var analysis = analysisRepository.save(
            Analysis.builder()
                    .title("Running...")
                    .projectKey(projectKey)
                    .type(Analysis.Type.valueOf(type))
                    .status(Analysis.Status.PENDING)
                    .build()
        );

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.DEFECT_EXCHANGE,
                RabbitMQConfig.DEFECT_ROUTING_KEY,
                analysis.getId()
        );
    }
}
