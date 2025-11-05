package io.ratsnake.llm.dto.out;

import dev.langchain4j.model.output.structured.Description;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DefectReport {
    @Description("A concise title for the defect report, around 5 words")
    private String title;

    @Description("The detailed report")
    private String content;
}
