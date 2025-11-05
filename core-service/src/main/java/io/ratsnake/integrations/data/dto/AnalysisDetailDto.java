package io.ratsnake.integrations.data.dto;

import io.ratsnake.integrations.data.entity.AnalysisDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class AnalysisDetailDto {
    private String id;
    private String summary;
    private List<DefectDto> defects;

    public AnalysisDetailDto(AnalysisDetail analysisDetail) {
        this.id = analysisDetail.getId();
        this.summary = analysisDetail.getSummary();
        this.defects = analysisDetail.getDefects().stream()
                .map(DefectDto::new)
                .toList();
    }
}
