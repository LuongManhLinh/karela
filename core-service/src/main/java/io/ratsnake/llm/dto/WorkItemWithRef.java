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
public class WorkItemWithRef {
    private String id;
    private String type;
    private String title;
    private String description;
    private List<String> relatedWorkItemIds;
}
