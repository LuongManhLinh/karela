package io.ratsnake.llm.adapter;

import io.ratsnake.llm.aiservice.DefectAiService;
import io.ratsnake.llm.dto.*;
import io.ratsnake.llm.dto.in.DetectDefectInput;
import io.ratsnake.llm.dto.in.GenerateGherkinInput;
import io.ratsnake.llm.dto.in.GenerateUserStoryInput;
import io.ratsnake.llm.dto.out.DetectDefectOutput;
import io.ratsnake.llm.dto.out.ImproveItemOutput;
import io.ratsnake.llm.models.DynamicModel;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

import static io.ratsnake.util.LanguageProcessor.*;


public class DefectAiAdapter extends AiAdapter<DefectAiService> {
    public DefectAiAdapter(DynamicModel<DefectAiService> model) {
        super(model);
    }

    private static final ContextInput exampleContext = ContextInput.builder()
            .documentation(ContextInput.Documentation.builder()
                    .productVision("A flight booking application that allows users to search, book, and manage their flights easily.")
                    .productScope("""
                            In-scope:
                            - Flight search and booking
                            - User account management
                            - Payment processing
                            - Booking management (view, change, cancel)
                            - Notifications and alerts
                            Out-of-scope:
                            - Hotel and car rental bookings
                            - Travel insurance
                            - Customer support services
                            """)
                    .glossary("""
                            - Booking: The process of reserving a flight.
                            - Itinerary: A detailed plan of a user's flight schedule.
                            - PNR (Passenger Name Record): A unique identifier for a booking.
                            - Fare Class: The category of service and pricing for a flight.
                            - Check-in: The process of confirming a flight reservation and obtaining a boarding pass.
                            """)
                    .constraints("""
                            - The system must comply with GDPR regulations regarding user data.
                            - Payment processing must be PCI-DSS compliant.
                            - The application should support high availability and handle peak loads during holiday seasons.
                            - The system must integrate with multiple airline APIs for flight data.
                            - The user interface must be responsive and accessible on both desktop and mobile devices.
                            """)
                    .sprintGoals("Implement user authentication and flight search functionality.")
                    .build())
            .guidelines("""
                    Should focus more on User Stories and Tasks.
                    Focusing on Bug items is unnecessary.
                    Should avoid technical implementation details.
                    """)
            .build();


    public ImproveItemOutput improveStructuredUserStory(GenerateUserStoryInput input) {
        return model().improveStructuredUserStory(safeJsonify(input));
    }


    public ImproveItemOutput improveStructuredGherkin(GenerateGherkinInput input) {
        return model().improveStructuredGherkin(safeJsonify(input));
    }

    public List<DefectLlm> checkDefects(List<WorkItemWithRef> workItems) {

        ExecutorService ex = Executors.newFixedThreadPool(3);
        CompletableFuture<DetectDefectOutput> f1 =
                CompletableFuture.supplyAsync(() -> checkWorkItemsSingleType(workItems, "Story"), ex);
        CompletableFuture<DetectDefectOutput> f2 =
                CompletableFuture.supplyAsync(() -> checkWorkItemsSingleType(workItems, "Task"), ex);
        CompletableFuture<DetectDefectOutput> f3 =
                CompletableFuture.supplyAsync(() -> checkWorkItemsSingleType(workItems, "Bug"), ex);
        CompletableFuture<DetectDefectOutput> f4 =
                CompletableFuture.supplyAsync(() -> checkSingleWorkItem(workItems), ex);
        CompletableFuture<DetectDefectOutput> f5 =
                CompletableFuture.supplyAsync(() -> DetectDefectOutput.builder().defects(List.of()).build(), ex);

        var outputs = CompletableFuture.allOf(f1, f2, f3, f4, f5)
                .thenApply(v -> Stream.of(f1, f2, f3, f4, f5)
                                .map(CompletableFuture::join)
                                .toList())
                .join();
        ex.shutdown();

        return outputs.stream()
                .flatMap(output -> output.getDefects().stream())
                .toList();
    }

    private DetectDefectOutput checkWorkItemsSingleType(List<WorkItemWithRef> workItems, String type) {
        List<WorkItemMinimal> items = workItems.stream()
                .filter(item -> item.getType().equalsIgnoreCase(type))
                .map(item -> WorkItemMinimal.builder()
                        .id(item.getId())
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .build())
                .toList();

        if (items.isEmpty()) {
            return DetectDefectOutput.builder().defects(List.of()).build();
        }

        var input = DetectDefectInput.SingleType.builder()
                .context(exampleContext)
                .type(type)
                .workItems(items)
                .build();
        return model().checkWorkItemsSingleType(safeJsonify(input));
    }

    private DetectDefectOutput checkSingleWorkItem(List<WorkItemWithRef> workItems) {
        List<WorkItem> items = workItems.stream()
                .map(item -> WorkItem.builder()
                        .id(item.getId())
                        .type(item.getType())
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .build())
                .toList();
        if (items.isEmpty()) {
            return DetectDefectOutput.builder().defects(List.of()).build();
        }
        var input = DetectDefectInput.SingleItem.builder()
                .context(exampleContext)
                .workItems(items)
                .build();
        return model().checkSingleWorkItem(safeJsonify(input));
    }

    private DetectDefectOutput checkWorkItemsCrossTypes(List<WorkItemWithRef> workItems) {
        if (workItems.isEmpty()) {
            return DetectDefectOutput.builder().defects(List.of()).build();
        }

        var input = DetectDefectInput.CrossTypes.builder()
                .context(exampleContext)
                .workItems(workItems)
                .build();
        return model().checkWorkItemsCrossTypes(safeJsonify(input));
    }


}
