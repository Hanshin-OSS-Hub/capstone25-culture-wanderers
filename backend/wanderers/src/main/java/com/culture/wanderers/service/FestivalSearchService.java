package com.culture.wanderers.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.culture.wanderers.dto.GeminiExtractResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.FestivalRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class FestivalSearchService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final Set<String> NOISE_KEYWORDS = Set.of(
            "추천", "추천해줘", "알려줘", "있어", "어디", "뭐", "좋아",
            "가볼만한", "가볼만한데", "갈만한", "갈만한데", "놀거리", "참여하는", "관련된",
            "행사", "축제", "전시", "공연", "체험", "문화행사",
            "오늘", "내일", "모레", "무료"
    );

    private static final Map<String, List<String>> KEYWORD_EXPANSIONS = createKeywordExpansions();

    private final FestivalRepository festivalRepository;

    public FestivalSearchService(FestivalRepository festivalRepository) {
        this.festivalRepository = festivalRepository;
    }

    public List<Festival> searchByExtractedConditions(GeminiExtractResponse condition) {
        List<String> normalizedKeywords = normalizeSearchKeywords(condition != null ? condition.getKeywords() : null);
        List<String> expandedKeywords = expandKeywords(normalizedKeywords);
        LocalDate today = LocalDate.now();

        List<Festival> primaryCandidates = festivalRepository.findAll(buildBaseSpecification(condition, false));
        List<Festival> relaxedDateCandidates = shouldRelaxDate(condition, primaryCandidates)
                ? festivalRepository.findAll(buildBaseSpecification(condition, true))
                : primaryCandidates;

        List<Festival> candidates = primaryCandidates.isEmpty() ? relaxedDateCandidates : primaryCandidates;
        if (candidates.isEmpty()) {
            return List.of();
        }

        List<ScoredFestival> scored = scoreFestivals(candidates, expandedKeywords, today);
        if (!scored.isEmpty()) {
            return toSortedUniqueFestivals(scored);
        }

        if (!expandedKeywords.isEmpty()) {
            List<Festival> keywordRelaxedCandidates = relaxedDateCandidates.isEmpty() ? candidates : relaxedDateCandidates;
            List<ScoredFestival> relaxedKeywordScored = scoreFestivals(keywordRelaxedCandidates, List.of(), today);
            if (!relaxedKeywordScored.isEmpty()) {
                return toSortedUniqueFestivals(relaxedKeywordScored);
            }
        }

        return List.of();
    }

    private List<ScoredFestival> scoreFestivals(List<Festival> candidates, List<String> expandedKeywords, LocalDate today) {
        List<ScoredFestival> scored = new ArrayList<>();

        for (Festival festival : candidates) {
            int primaryKeywordScore = computePrimaryKeywordScore(festival, expandedKeywords);
            int secondaryKeywordScore = computeSecondaryKeywordScore(festival, expandedKeywords);
            int keywordScore = primaryKeywordScore + secondaryKeywordScore;

            if (!expandedKeywords.isEmpty() && keywordScore <= 0) {
                continue;
            }

            int totalScore = keywordScore * 10
                    + computeDatePriority(festival, today)
                    + computePricePriority(festival);

            scored.add(new ScoredFestival(festival, totalScore, keywordScore, primaryKeywordScore));
        }

        if (expandedKeywords.isEmpty()) {
            return candidates.stream()
                    .map(festival -> new ScoredFestival(
                            festival,
                            computeDatePriority(festival, today) + computePricePriority(festival),
                            0,
                            0
                    ))
                    .toList();
        }

        if (scored.stream().anyMatch(item -> item.primaryKeywordScore() > 0)) {
            return scored.stream()
                    .filter(item -> item.primaryKeywordScore() > 0)
                    .toList();
        }

        return scored;
    }

    private List<Festival> toSortedUniqueFestivals(List<ScoredFestival> scored) {
        return scored.stream()
                .sorted(Comparator
                        .comparingInt(ScoredFestival::totalScore).reversed()
                        .thenComparing((ScoredFestival item) -> safeDateString(item.festival().getStartDate()))
                        .thenComparing(item -> String.valueOf(item.festival().getTitle())))
                .collect(LinkedHashMapCollector.toUniqueFestivalMap())
                .values().stream()
                .limit(5)
                .toList();
    }

    private boolean shouldRelaxDate(GeminiExtractResponse condition, List<Festival> primaryCandidates) {
        return condition != null
                && hasText(condition.getDate())
                && primaryCandidates.isEmpty();
    }

    private Specification<Festival> buildBaseSpecification(GeminiExtractResponse condition, boolean relaxedDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            String today = LocalDate.now().format(DATE_FORMATTER);
            predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), today));

            if (condition != null) {
                if (hasText(condition.getRegion())) {
                    predicates.add(cb.like(
                            cb.lower(root.get("region")),
                            "%" + condition.getRegion().trim().toLowerCase() + "%"
                    ));
                }

                if (hasText(condition.getCategory())) {
                    predicates.add(cb.like(
                            cb.lower(root.get("category")),
                            "%" + condition.getCategory().trim().toLowerCase() + "%"
                    ));
                }

                if (hasText(condition.getDate())) {
                    String date = condition.getDate().trim();
                    LocalDate target = LocalDate.parse(date, DATE_FORMATTER);
                    String endRange = (relaxedDate ? target.plusDays(21) : target.plusDays(7))
                            .format(DATE_FORMATTER);

                    predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), endRange));
                    predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), date));
                }

                if (condition.getPriceMax() != null && condition.getPriceMax() == 0) {
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("price")), "%무료%"),
                            cb.like(cb.lower(root.get("price")), "%입장료없음%"),
                            cb.like(cb.lower(root.get("price")), "%없음%"),
                            cb.like(cb.lower(root.get("price")), "%0원%")
                    ));
                }
            }

            query.orderBy(cb.asc(root.get("startDate")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private List<String> normalizeSearchKeywords(List<String> keywords) {
        LinkedHashSet<String> result = new LinkedHashSet<>();
        if (keywords == null) {
            return List.of();
        }

        for (String keyword : keywords) {
            if (!hasText(keyword)) {
                continue;
            }

            String cleaned = keyword.trim().toLowerCase()
                    .replaceAll("[^0-9a-z가-힣\\s]", " ")
                    .replaceAll("\\s+", " ")
                    .trim();

            if (cleaned.isBlank()) {
                continue;
            }

            for (String token : cleaned.split(" ")) {
                String normalized = token.trim();
                if (normalized.isBlank()) {
                    continue;
                }
                if (NOISE_KEYWORDS.contains(normalized)) {
                    continue;
                }
                result.add(normalized);
            }
        }

        return result.stream().limit(10).toList();
    }

    private List<String> expandKeywords(List<String> keywords) {
        LinkedHashSet<String> expanded = new LinkedHashSet<>();
        for (String keyword : keywords) {
            expanded.add(keyword);
            for (Map.Entry<String, List<String>> entry : KEYWORD_EXPANSIONS.entrySet()) {
                if (keyword.contains(entry.getKey()) || entry.getKey().contains(keyword)) {
                    expanded.addAll(entry.getValue());
                }
            }
        }
        return expanded.stream().toList();
    }

    private int computePrimaryKeywordScore(Festival festival, List<String> keywords) {
        if (keywords.isEmpty()) {
            return 0;
        }

        int score = 0;
        String title = normalizeText(festival.getTitle());
        String category = normalizeText(festival.getCategory());
        String location = normalizeText(festival.getLocation());
        String region = normalizeText(festival.getRegion());

        for (String keyword : keywords) {
            if (!hasText(keyword)) {
                continue;
            }

            String normalizedKeyword = keyword.toLowerCase();
            if (title.contains(normalizedKeyword)) {
                score += 8;
            }
            if (category.contains(normalizedKeyword)) {
                score += 5;
            }
            if (location.contains(normalizedKeyword) || region.contains(normalizedKeyword)) {
                score += 2;
            }
        }

        return score;
    }

    private int computeSecondaryKeywordScore(Festival festival, List<String> keywords) {
        if (keywords.isEmpty()) {
            return 0;
        }

        int score = 0;
        String description = normalizeText(festival.getDescription());
        for (String keyword : keywords) {
            if (!hasText(keyword)) {
                continue;
            }

            String normalizedKeyword = keyword.toLowerCase();
            if (description.contains(normalizedKeyword)) {
                score += 2;
            }
        }
        return score;
    }

    private int computeDatePriority(Festival festival, LocalDate today) {
        try {
            if (!hasText(festival.getStartDate()) || !hasText(festival.getEndDate())) {
                return 0;
            }

            LocalDate startDate = LocalDate.parse(festival.getStartDate(), DATE_FORMATTER);
            LocalDate endDate = LocalDate.parse(festival.getEndDate(), DATE_FORMATTER);

            if ((today.isEqual(startDate) || today.isAfter(startDate))
                    && (today.isEqual(endDate) || today.isBefore(endDate))) {
                return 40;
            }

            if (today.isBefore(startDate)) {
                long days = ChronoUnit.DAYS.between(today, startDate);
                return (int) Math.max(0, 30 - days);
            }

            return -50;
        } catch (Exception e) {
            return 0;
        }
    }

    private int computePricePriority(Festival festival) {
        String price = normalizeText(festival.getPrice());
        if (price.isBlank()) {
            return 0;
        }
        if (price.contains("무료") || price.contains("입장료없음") || price.contains("0원")) {
            return 5;
        }
        return 0;
    }

    private String safeDateString(String date) {
        return hasText(date) ? date : "99999999";
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.toLowerCase();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static Map<String, List<String>> createKeywordExpansions() {
        Map<String, List<String>> expansions = new LinkedHashMap<>();
        expansions.put("꽃", List.of("꽃", "벚꽃", "장미", "양귀비", "수국", "튤립"));
        expansions.put("도자기", List.of("도자기", "도자", "도예", "세라믹", "찻사발"));
        expansions.put("도자", List.of("도자기", "도자", "도예", "세라믹", "찻사발"));
        expansions.put("드론", List.of("드론"));
        expansions.put("음식", List.of("음식", "먹거리", "푸드", "미식"));
        expansions.put("먹거리", List.of("음식", "먹거리", "푸드", "미식"));
        expansions.put("마라톤", List.of("마라톤", "러닝", "런", "달리기", "걷기", "워킹", "트레킹", "산책"));
        expansions.put("러닝", List.of("마라톤", "러닝", "런", "달리기", "걷기", "워킹", "트레킹"));
        expansions.put("달리기", List.of("마라톤", "러닝", "런", "달리기", "걷기", "워킹", "트레킹"));
        expansions.put("걷", List.of("걷기", "워킹", "트레킹", "산책", "걷자", "걷자잉", "슬로걷기"));
        expansions.put("산책", List.of("걷기", "워킹", "트레킹", "산책", "슬로걷기"));
        expansions.put("애완동물", List.of("애완동물", "반려동물", "반려견", "강아지", "댕댕이", "펫", "반려묘", "고양이"));
        expansions.put("반려동물", List.of("애완동물", "반려동물", "반려견", "강아지", "댕댕이", "펫", "반려묘", "고양이"));
        expansions.put("강아지", List.of("애완동물", "반려동물", "반려견", "강아지", "댕댕이", "펫"));
        expansions.put("반려견", List.of("애완동물", "반려동물", "반려견", "강아지", "댕댕이", "펫"));
        expansions.put("펫", List.of("애완동물", "반려동물", "반려견", "강아지", "댕댕이", "펫", "반려묘", "고양이"));
        return expansions;
    }

    private record ScoredFestival(Festival festival, int totalScore, int keywordScore, int primaryKeywordScore) {
    }

    private static final class LinkedHashMapCollector {
        private LinkedHashMapCollector() {
        }

        static java.util.stream.Collector<ScoredFestival, ?, LinkedHashMap<String, Festival>> toUniqueFestivalMap() {
            return java.util.stream.Collectors.toMap(
                    item -> normalizeFestivalKey(item.festival()),
                    ScoredFestival::festival,
                    (existing, replacement) -> existing,
                    LinkedHashMap::new
            );
        }

        private static String normalizeFestivalKey(Festival festival) {
            String title = festival.getTitle() == null ? "" : festival.getTitle()
                    .replaceAll("[^0-9A-Za-z가-힣]", "")
                    .toLowerCase();
            String region = festival.getRegion() == null ? "" : festival.getRegion().trim().toLowerCase();
            String startDate = festival.getStartDate() == null ? "" : festival.getStartDate().trim();
            return title + "|" + region + "|" + startDate;
        }
    }
}
