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
public class Example {
    private String id;
    private String variable;
    private List<String> values;

    @Override
    public String toString() {
        int longestRowLength = values.stream().mapToInt(String::length).max().orElse(0);

        StringBuilder sb = new StringBuilder();
        String border = "+" + "-".repeat(longestRowLength + 2) + "+\n";
        sb.append(border);
        for (String row : values) {
            sb.append("| ").append(row);
            sb.append(" ".repeat(longestRowLength - row.length()));
            sb.append(" |\n");
        }

        sb.append(border);
        return sb.toString();
    }

    public static void main(String[] args) {
        var example = Example.builder()
                .id("1")
                .variable("Card type")
                .values(List.of("VISA", "MASTERCARD", "AMEX"))
                .build();
        System.out.println(example);
    }
}
