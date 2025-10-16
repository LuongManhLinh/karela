package io.ratsnake.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Defect {
    private String type;
    private List<String> workItemIds;
    private String severity;
    private String explanation;
    private String suggestedImprovements;
}