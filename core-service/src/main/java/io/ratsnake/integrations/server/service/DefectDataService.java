package io.ratsnake.integrations.server.service;

import io.ratsnake.integrations.data.dto.AnalysisDetailDto;
import io.ratsnake.integrations.data.dto.AnalysisStatus;
import io.ratsnake.integrations.data.repository.AnalysisDetailRepository;
import io.ratsnake.integrations.data.repository.AnalysisRepository;
import io.ratsnake.integrations.data.dto.AnalysisBrief;
import io.ratsnake.integrations.server.dto.AnalysisBriefResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DefectDataService {
    @Autowired
    private final AnalysisRepository analysisRepository;

    @Autowired
    private final AnalysisDetailRepository analysisDetailRepository;

    public AnalysisStatus getAnalysisStatus(String analysisId) {
        return analysisRepository.findById(analysisId, AnalysisStatus.class).orElseThrow();
    }

    public List<AnalysisBrief> getAllAnalysesBrief() {
        return analysisRepository.findAllProjectedByOrderByStartedAtDesc();
    }

    public AnalysisDetailDto getAnalysisDetail(String analysisId) {
        var detail = analysisDetailRepository.findByAnalysisId(analysisId)
                .orElseThrow();
        return new AnalysisDetailDto(detail);
    }
}
