package io.ratsnake.integrations.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Table(name = "defects")
@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Defect {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_detail_id", nullable = false, foreignKey = @ForeignKey(name = "fk_defect_analysis_detail"))
    private AnalysisDetail analysisDetail;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Type type;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(nullable = false, length = 1000)
    private String explanation;

    @Column(nullable = false)
    private Double confidence;

    @Column(length = 2000)
    private String suggestedImprovements;

    @Column(nullable = false)
    @Builder.Default
    private Boolean solved = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "defect_work_item_ids",
            joinColumns = @JoinColumn(name = "defect_id"),
            indexes = @Index(name = "idx_defect_wi_ids", columnList = "defect_id"))
    @Column(name = "work_item_ids", nullable = false)
    private List<String> workItemIds;

    public enum Type {
        CONFLICT,
        DUPLICATION,
        ENTAILMENT,
        INCONSISTENCY,
        OUT_OF_SCOPE,
        INCOMPLETENESS,
        AMBIGUITY,
        IRRELEVANCE,
        OTHER
    }

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH
    }
}
