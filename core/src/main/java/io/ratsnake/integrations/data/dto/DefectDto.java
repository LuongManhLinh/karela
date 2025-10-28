package io.ratsnake.integrations.data.dto;

import io.ratsnake.integrations.data.entity.Defect;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class DefectDto {
    private String id;
    private String type;
    private String severity;
    private String explanation;
    private Double confidence;
    private String suggestedImprovements;
    private Boolean solved;
    private List<String> workItemIds;

    public DefectDto(Defect defect) {
        this.id = defect.getId();
        this.type = defect.getType().name();
        this.severity = defect.getSeverity().name();
        this.explanation = defect.getExplanation();
        this.confidence = defect.getConfidence();
        this.suggestedImprovements = defect.getSuggestedImprovements();
        this.solved = defect.getSolved();
        this.workItemIds = defect.getWorkItemIds();
    }
}
