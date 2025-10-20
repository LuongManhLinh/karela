package io.ratsnake.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotifyDefectInput {
    private int defectCount;
    private int highSeverityCount;
    private Set<String> relatedDefectTypes;
}
