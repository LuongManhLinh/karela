package io.ratsnake.llm.adapter;

import io.ratsnake.llm.aiservice.DefectAiService;
import io.ratsnake.llm.dto.*;
import io.ratsnake.llm.models.DynamicModel;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;


public class DefectAiAdapter extends AiAdapter<DefectAiService> {
    public DefectAiAdapter(
            DynamicModel<DefectAiService> model,
            int maxRetries
    ) {
        super(model, maxRetries);
    }

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
        return executeWithRetries(
                input,
                ImproveItemOutput.class,
                model()::improveStructuredUserStory,
                "IMPROVE_USER_STORY"
        );
    }


    public ImproveItemOutput improveStructuredGherkin(GenerateGherkinInput input) {
        return executeWithRetries(
                input,
                ImproveItemOutput.class,
                model()::improveStructuredGherkin,
                "IMPROVE_GHERKIN"
        );
    }

    public List<DetectDefectOutput> checkDefects(List<WorkItemWithRef> workItems) {

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
                CompletableFuture.supplyAsync(() -> checkWorkItemsCrossTypes(workItems), ex);

        return CompletableFuture.allOf(f1, f2, f3, f4, f5)
                .thenApply(v -> Stream.of(f1, f2, f3, f4, f5)
                                .map(CompletableFuture::join)
                                .toList())
                .join();
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
        var input = DetectDefectInput.SingleType.builder()
                .context(exampleContext)
                .type(type)
                .workItems(items)
                .build();
        return executeWithRetries(
                input,
                DetectDefectOutput.class,
                model()::checkWorkItemsSingleType,
                "CHECK_WORK_ITEMS_SINGLE_TYPE"
        );
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
        var input = DetectDefectInput.SingleItem.builder()
                .context(exampleContext)
                .workItems(items)
                .build();
        return executeWithRetries(
                input,
                DetectDefectOutput.class,
                model()::checkSingleWorkItem,
                "CHECK_SINGLE_WORK_ITEM"
        );
    }

    private DetectDefectOutput checkWorkItemsCrossTypes(List<WorkItemWithRef> workItems) {
        var input = DetectDefectInput.CrossTypes.builder()
                .context(exampleContext)
                .workItems(workItems)
                .build();
        return executeWithRetries(
                input,
                DetectDefectOutput.class,
                model()::checkWorkItemsCrossTypes,
                "CHECK_WORK_ITEMS_CROSS_TYPES"
        );
    }


}
