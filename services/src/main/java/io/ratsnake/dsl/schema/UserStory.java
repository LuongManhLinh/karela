package io.ratsnake.dsl.schema;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserStory {
    private String id;

    private String title;

    private String role;

    private String feature;

    private String benefit;

    private Priority priority;

    private Type type;

    private List<AcceptanceCriterion> acceptanceCriteria;

    public enum Type {
        FR, NFR
    }



    public enum Priority {
        P0, P1, P2, P3
    }
}
