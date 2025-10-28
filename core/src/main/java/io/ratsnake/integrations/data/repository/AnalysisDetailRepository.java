package io.ratsnake.integrations.data.repository;

import io.ratsnake.integrations.data.entity.AnalysisDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnalysisDetailRepository extends JpaRepository<AnalysisDetail, String> {
    Optional<AnalysisDetail> findByAnalysisId(String analysisId);
}
