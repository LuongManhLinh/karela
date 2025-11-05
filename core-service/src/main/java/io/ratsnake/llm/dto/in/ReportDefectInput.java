package io.ratsnake.llm.dto.in;

import io.ratsnake.llm.dto.DefectLlm;
import io.ratsnake.llm.dto.WorkItem;
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
    private List<DefectLlm> defects;
    private List<WorkItem> analyzedWorkItems;
}
