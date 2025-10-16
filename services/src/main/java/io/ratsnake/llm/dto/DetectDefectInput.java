package io.ratsnake.llm.dto;

import lombok.*;

import java.util.List;


public abstract class DetectDefectInput {

    @Data
    @Builder
    @AllArgsConstructor
    public static class SingleType {
        private ContextInput context;
        private String type;
        private List<WorkItemMinimal> workItems;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class SingleItem{
        private ContextInput context;
        private List<WorkItem> workItems;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class CrossTypes {
        private ContextInput context;
        private List<WorkItemWithRef> workItems;
    }
}
