package io.ratsnake.llm.dto.out;

import io.ratsnake.llm.dto.DefectLlm;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DetectDefectOutput {
    private List<DefectLlm> defects;
}
