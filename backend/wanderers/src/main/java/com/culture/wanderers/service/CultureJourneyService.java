package com.culture.wanderers.service;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.culture.wanderers.dto.CultureJourneyResponse;
import com.culture.wanderers.dto.CultureJourneyResponse.JourneyStatItem;
import com.culture.wanderers.dto.CultureJourneyResponse.JourneyVisitItem;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.VisitedFestival;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.VisitedFestivalRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CultureJourneyService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final VisitedFestivalRepository visitedFestivalRepository;
    private final FestivalRepository festivalRepository;

    public CultureJourneyResponse getJourney(String email) {
        List<VisitedFestival> visits = visitedFestivalRepository.findByUserEmailOrderByVisitedAtDesc(email);

        Map<String, Integer> regionCounts = new HashMap<>();
        Map<String, Integer> categoryCounts = new HashMap<>();

        List<JourneyVisitItem> recentVisits = visits.stream()
                .limit(3)
                .map(visit -> {
                    Festival festival = visit.getFestivalId() == null
                            ? null
                            : festivalRepository.findById(visit.getFestivalId()).orElse(null);

                    String region = festival != null ? festival.getRegion() : null;
                    String category = festival != null ? festival.getCategory() : null;

                    merge(regionCounts, region);
                    merge(categoryCounts, category);

                    return new JourneyVisitItem(
                            visit.getFestivalId(),
                            visit.getFestivalTitle(),
                            region,
                            category,
                            visit.getVisitedAt() == null ? "" : visit.getVisitedAt().format(DATE_FORMATTER)
                    );
                })
                .toList();

        visits.stream().skip(3).forEach(visit -> {
            if (visit.getFestivalId() == null) {
                return;
            }

            festivalRepository.findById(visit.getFestivalId()).ifPresent(festival -> {
                merge(regionCounts, festival.getRegion());
                merge(categoryCounts, festival.getCategory());
            });
        });

        int totalVisits = visits.size();

        return new CultureJourneyResponse(
                totalVisits,
                levelName(totalVisits),
                levelDescription(totalVisits),
                topKey(regionCounts),
                topKey(categoryCounts),
                recentVisits,
                topStats(regionCounts)
        );
    }

    private void merge(Map<String, Integer> counts, String value) {
        if (value != null && !value.isBlank()) {
            counts.merge(value, 1, Integer::sum);
        }
    }

    private String topKey(Map<String, Integer> counts) {
        return counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private List<JourneyStatItem> topStats(Map<String, Integer> counts) {
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(3)
                .map(entry -> new JourneyStatItem(entry.getKey(), entry.getValue()))
                .toList();
    }

    private String levelName(int totalVisits) {
        if (totalVisits >= 10) return "문화 마스터";
        if (totalVisits >= 6) return "문화 탐험가";
        if (totalVisits >= 3) return "문화 산책러";
        if (totalVisits >= 1) return "문화 입문자";
        return "여행 준비 중";
    }

    private String levelDescription(int totalVisits) {
        if (totalVisits >= 10) return "다양한 지역과 행사를 꾸준히 경험하고 있어요.";
        if (totalVisits >= 6) return "방문 기록이 충분히 쌓여 취향이 뚜렷해지고 있어요.";
        if (totalVisits >= 3) return "문화 여정이 조금씩 풍성해지고 있어요.";
        if (totalVisits >= 1) return "첫 방문 기록이 만들어졌어요. 다음 여정을 이어가볼까요?";
        return "다녀왔어요를 누르면 나의 문화 여정이 시작돼요.";
    }
}
