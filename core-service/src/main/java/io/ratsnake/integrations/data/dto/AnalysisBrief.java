package io.ratsnake.integrations.data.dto;

import java.time.LocalDateTime;

public interface AnalysisBrief {
    String getId();
    String getTitle();
    String getStatus();
    LocalDateTime getStartedAt();
    LocalDateTime getEndedAt();
    String getType();
}
