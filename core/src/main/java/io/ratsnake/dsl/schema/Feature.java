package io.ratsnake.dsl.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Feature {
    private String title;
    private String inOrderTo;
    private String asA;
    private String wantTo;
}
