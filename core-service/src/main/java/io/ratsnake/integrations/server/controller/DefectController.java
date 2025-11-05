package io.ratsnake.integrations.server.controller;

import io.ratsnake.integrations.server.dto.AnalysisRequest;
import io.ratsnake.integrations.server.service.DefectDataService;
import io.ratsnake.integrations.server.service.DefectProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/defect")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class DefectController {
    @Autowired
    private final DefectDataService defectDataService;

    @Autowired
    private final DefectProducer defectProducer;

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Defect Service is up and running");
    }

    @PostMapping("/analysis")
    public ResponseEntity<?> analyzeWorkItems(
            @RequestBody AnalysisRequest request
    ) {
        try {
            defectProducer.startAnalysis(request.getProjectKey(), "ALL");
            return ResponseEntity.ok(Map.of("message", "Analysis started successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error analyzing work items: " + e.getMessage());
        }
    }

    @GetMapping("/analysis")
    public ResponseEntity<?> getAllAnalysesBrief() {
        try {
            var res = defectDataService.getAllAnalysesBrief();
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching analyses brief: " + e.getMessage());
        }
    }

    @GetMapping("/analysis/{analysisId}/status")
    public ResponseEntity<?> getAnalysisStatus(
            @PathVariable String analysisId
    ) {
        try {
            var res = defectDataService.getAnalysisStatus(analysisId);
            return ResponseEntity.ok(res);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body("Analysis not found: " + analysisId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching analysis status: " + e.getMessage());
        }
    }

    @GetMapping("/analysis/{analysisId}")
    public ResponseEntity<?> getAnalysisDetail(
            @PathVariable String analysisId
    ) {
        try {
            var res = defectDataService.getAnalysisDetail(analysisId);
            return ResponseEntity.ok(res);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body("Analysis not found: " + analysisId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching analysis detail: " + e.getMessage());
        }
    }
}
