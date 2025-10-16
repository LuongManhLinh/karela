package io.ratsnake.integrations.server;

import io.ratsnake.llm.dto.GenerateGherkinInput;
import io.ratsnake.llm.dto.GenerateUserStoryInput;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/llm")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class LlmController {
    @Autowired
    private LlmService llmService;

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("LLM Service is up and running");
    }

    @GetMapping("/defect/analyze")
    public ResponseEntity<?> analyzeWorkItems(
            @RequestParam("projectKey") String projectKey
    ) {
        try {
            var res = llmService.analyzeWorkItems(projectKey);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error analyzing work items: " + e.getMessage());
        }
    }

    @PostMapping("/improve/user-story")
    public ResponseEntity<?> improveUserStory(
            @RequestBody GenerateUserStoryInput body
    ) {
        try {
            var res = llmService.improveUserStory(body);
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
            var res = llmService.improveGherkin(body);
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
            var res = llmService.suggestWhileWritingGherkin(body);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error suggesting gherkin: " + e.getMessage());
        }
    }
}
