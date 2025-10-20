package io.ratsnake.dsl.schema;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserStory {
    private String id;

    private String summary;

    private String asA;

    private String want;

    private String soThat;

    private Priority priority;

    private Type type;

    private List<Gherkin> acceptanceCriteria;

    public enum Type {
        FR, NFR
    }

    public enum Priority {
        P0, P1, P2, P3
    }
}
