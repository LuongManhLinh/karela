package io.ratsnake.integrations.server.controller;

import io.ratsnake.integrations.server.service.FormulationService;
import io.ratsnake.llm.dto.in.GenerateGherkinInput;
import io.ratsnake.llm.dto.in.GenerateUserStoryInput;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/formulation")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class FormulationController {
    @Autowired
    private final FormulationService formulationService;

    @PostMapping("/improve/user-story")
    public ResponseEntity<?> improveUserStory(
            @RequestBody GenerateUserStoryInput body
    ) {
        try {
            var res = formulationService.improveUserStory(body);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error improving user story: " + e.getMessage());
        }
    }

    @PostMapping("/improve/gherkin")
    public ResponseEntity<?> improveGherkin(
            @RequestBody GenerateGherkinInput body
    ) {
        try {
            var res = formulationService.improveGherkin(body);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error improving gherkin: " + e.getMessage());
        }
    }

    @PostMapping("/suggest/gherkin")
    public ResponseEntity<?> suggestWhileWritingGherkin(
            @RequestBody GenerateGherkinInput body
    ) {
        try {
            var res = formulationService.suggestWhileWritingGherkin(body);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error suggesting gherkin: " + e.getMessage());
        }
    }
}
