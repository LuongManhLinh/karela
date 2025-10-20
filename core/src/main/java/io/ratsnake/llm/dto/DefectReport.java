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
public class DefectReport {
    private String title;
    private String content;
    private List<String> suggestions;
}
