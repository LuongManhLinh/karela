package io.ratsnake.integrations.server.dto;

import io.ratsnake.integrations.data.dto.AnalysisBrief;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
public class AnalysisBriefResponse {
    private String id;
    private String title;
    private String status;
    private String startedAt;
    private String type;

    public AnalysisBriefResponse(AnalysisBrief analysisBrief) {
        this.id = analysisBrief.getId();
        this.title = analysisBrief.getTitle();
        this.status = analysisBrief.getStatus();

        // Convert startedAt to format "yyyy/MM/dd HH:mm:ss"
        this.startedAt = analysisBrief.getStartedAt().format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"));
        this.type = analysisBrief.getType();
    }

}
