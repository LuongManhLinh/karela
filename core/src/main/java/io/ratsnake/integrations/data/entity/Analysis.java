package io.ratsnake.integrations.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Table(name = "analyses")
@Entity
@EntityListeners(AuditingEntityListener.class)
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Analysis {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String projectKey;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Type type;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(nullable = false)
    @CreatedDate
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime endedAt;

    @Column
    private String title;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "analysis")
    private AnalysisDetail analysisDetail;

    @Column(length = 2000)
    private String errorMessage;

    public enum Type {
        ALL,
        ON_ADDING,
        ON_MODIFYING,
        ON_DELETING
    }

    public enum Status {
        PENDING,
        IN_PROGRESS,
        DONE,
        FAILED
    }
}
