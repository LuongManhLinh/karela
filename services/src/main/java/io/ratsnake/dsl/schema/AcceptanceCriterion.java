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
public class AcceptanceCriterion {
    private String id;
    private String scenario;
    private List<String> given;
    private List<String> when;
    private List<String> then;
}
