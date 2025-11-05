package io.ratsnake.dsl.schema;

import lombok.*;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Gherkin {
    private Feature feature;
    private String background;
    private List<Scenario> scenarios;
}
