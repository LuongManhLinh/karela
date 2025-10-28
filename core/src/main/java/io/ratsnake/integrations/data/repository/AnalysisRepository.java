package io.ratsnake.integrations.data.repository;

import io.ratsnake.integrations.data.dto.AnalysisBrief;
import io.ratsnake.integrations.data.entity.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnalysisRepository extends JpaRepository<Analysis, String> {
    List<AnalysisBrief> findAllProjectedByOrderByStartedAtDesc();
    <T> Optional<T> findById(String id, Class<T> projection);
}
