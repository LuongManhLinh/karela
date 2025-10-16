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
public class ReportDefectInput {
    private List<DetectDefectOutput> defects;
    private List<WorkItem> analyzedWorkItems;
}
