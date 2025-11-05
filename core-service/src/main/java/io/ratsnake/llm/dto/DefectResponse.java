package io.ratsnake.llm.dto;

import io.ratsnake.llm.dto.out.DefectReport;
import io.ratsnake.llm.dto.out.DetectDefectOutput;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DefectResponse {
    private String notification;
    private DefectReport report;
}
