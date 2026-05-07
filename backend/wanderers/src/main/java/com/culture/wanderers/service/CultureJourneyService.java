package com.culture.wanderers.service;

import com.culture.wanderers.dto.CultureJourneyResponse;
import com.culture.wanderers.dto.CultureJourneyResponse.JourneyStatItem;
import com.culture.wanderers.dto.CultureJourneyResponse.JourneyVisitItem;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.VisitedFestival;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.VisitedFestivalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        int thisMonthVisits = (int) visits.stream()
                .filter(visit -> visit.getVisitedAt() != null)
                .filter(visit -> {
                    LocalDate visitedDate = visit.getVisitedAt().toLocalDate();
                    LocalDate now = LocalDate.now();
                    return visitedDate.getYear() == now.getYear() && visitedDate.getMonth() == now.getMonth();
                })
                .count();
        int cultureScore = Math.min(
                100,
                totalVisits * 4
                        + regionCounts.size() * 3
                        + categoryCounts.size() * 3
                        + thisMonthVisits * 3
        );

        return new CultureJourneyResponse(
                totalVisits,
                levelName(totalVisits),
                levelDescription(totalVisits),
                topKey(regionCounts),
                topKey(categoryCounts),
                recentVisits,
                topStats(regionCounts),
                topStats(categoryCounts),
                thisMonthVisits,
                cultureScore
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
        if (totalVisits >= 20) return "문화 마스터";
        if (totalVisits >= 12) return "문화 탐험가";
        if (totalVisits >= 5) return "문화 산책러";
        if (totalVisits >= 1) return "문화 입문자";
        return "여행 준비 중";
    }

    private String levelDescription(int totalVisits) {
        if (totalVisits >= 20) return "여러 지역과 장르를 꾸준히 경험하고 있어요.";
        if (totalVisits >= 12) return "방문 기록이 쌓여 취향이 또렷해지고 있어요.";
        if (totalVisits >= 5) return "문화 스탬프가 차근차근 모이고 있어요.";
        if (totalVisits >= 1) return "첫 방문 기록이 만들어졌어요. 다음 스탬프도 이어가볼까요?";
        return "다녀왔어요를 누르면 나의 문화 스탬프가 시작돼요.";
    }
}
