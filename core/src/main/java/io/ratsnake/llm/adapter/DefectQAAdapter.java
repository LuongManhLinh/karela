package io.ratsnake.llm.adapter;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.ratsnake.llm.aiservice.DefectQAAiService;
import io.ratsnake.llm.dto.*;
import io.ratsnake.llm.models.DynamicModel;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static io.ratsnake.util.LanguageProcessor.jsonify;

public class DefectQAAdapter extends AiAdapter<DefectQAAiService> {
    public DefectQAAdapter(DynamicModel<DefectQAAiService> model, int maxRetries) {
        super(model, maxRetries);
    }

    public DefectQAAdapter(DynamicModel<DefectQAAiService> model) {
        super(model);
    }

    public DefectResponse respondFromDetectedDefects(List<DetectDefectOutput> defectOutputs, List<WorkItem> workItems) throws JsonProcessingException {
        int defectCount = 0;
        int highSeverityCount = 0;
        Set<String> relatedDefectTypes = new HashSet<>();
        for (DetectDefectOutput output : defectOutputs) {
            for (Defect defect : output.getDefects()) {
                defectCount++;
                if ("high".equalsIgnoreCase(defect.getSeverity())) {
                    highSeverityCount++;
                }
                relatedDefectTypes.add(defect.getType());
            }
        }

        var notifyInput = NotifyDefectInput.builder()
                .defectCount(defectCount)
                .highSeverityCount(highSeverityCount)
                .relatedDefectTypes(relatedDefectTypes)
                .build();

        System.out.println("DefectQAAdapter: Preparing to notify with input: " + jsonify(notifyInput));

        var reportInput = ReportDefectInput.builder()
                .defects(defectOutputs)
                .analyzedWorkItems(workItems)
                .build();

        return DefectResponse.builder()
                .notification(notifyDefect(notifyInput))
                .report(reportDefect(reportInput))
                .defects(defectOutputs)
                .build();
    }

    private String notifyDefect(NotifyDefectInput input) throws JsonProcessingException {
        return executeWithRetries(
                jsonify(input),
                model()::notifyDefect,
                "NOTIFY_DEFECT"
        );
    }

    private DefectReport reportDefect(ReportDefectInput input) throws JsonProcessingException {
        return executeWithRetries(
                jsonify(input),
                DefectReport.class,
                model()::reportDefect,
                "REPORT_DEFECT"
        );
    }
}
