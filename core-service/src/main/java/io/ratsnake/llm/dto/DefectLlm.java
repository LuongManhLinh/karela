package io.ratsnake.llm.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class DefectLlm {
    @Description({"Type of the defect, one of the types mentioned in your instruction"})
    @JsonProperty(required = true)
    private String type;

    @Description("IDs of the work items involved in the issue.")
    @JsonProperty(required = true)
    private List<String> workItemIds;

    @Description("""
            "low" | "medium" | "high"\s""")
    @JsonProperty(required = true)
    private String severity;

    @JsonProperty(required = true)
    private String explanation;

    @JsonProperty(required = true)
    private Double confidence;

    @JsonProperty(required = true)
    private String suggestedImprovements;
}