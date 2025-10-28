package io.ratsnake.integrations.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Table(name = "analysis_details")
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false, foreignKey = @ForeignKey(name = "fk_analysis_detail_analysis"))
    private Analysis analysis;

    @Column(nullable = false, length = 4000)
    private String summary;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "analysisDetail")
    private List<Defect> defects;
}
