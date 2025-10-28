package io.ratsnake.llm.adapter;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.ratsnake.llm.aiservice.DefectQAAiService;
import io.ratsnake.llm.dto.*;
import io.ratsnake.llm.dto.in.NotifyDefectInput;
import io.ratsnake.llm.dto.in.ReportDefectInput;
import io.ratsnake.llm.dto.out.DefectReport;
import io.ratsnake.llm.models.DynamicModel;

import java.util.List;

import static io.ratsnake.util.LanguageProcessor.safeJsonify;

public class DefectQAAdapter extends AiAdapter<DefectQAAiService> {
    public DefectQAAdapter(DynamicModel<DefectQAAiService> model) {
        super(model);
    }

    public DefectResponse respondFromDetectedDefects(List<DefectLlm> defects, List<WorkItem> workItems) throws JsonProcessingException {
        int defectCount = 0;
        int highSeverityCount = 0;

//        var notifyInput = NotifyDefectInput.builder()
//                .defectCount(defectCount)
//                .highSeverityCount(highSeverityCount)
//                .relatedDefectTypes(relatedDefectTypes)
//                .build();

        var reportInput = ReportDefectInput.builder()
                .defects(defects)
                .analyzedWorkItems(workItems)
                .build();

        return DefectResponse.builder()
//                .notification(notifyDefect(notifyInput))
                .report(reportDefect(reportInput))
                .build();
    }

    private String notifyDefect(NotifyDefectInput input) {
        return model().notifyDefect(safeJsonify(input));
    }

    private DefectReport reportDefect(ReportDefectInput input) {
        return model().reportDefect(safeJsonify(input));
    }
}
