package io.ratsnake.integrations.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AnalysisResponse {
    private String analysisId;
    private String title;
    private String status;
}
