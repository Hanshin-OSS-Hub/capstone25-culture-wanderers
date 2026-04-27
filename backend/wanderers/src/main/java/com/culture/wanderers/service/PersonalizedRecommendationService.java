package com.culture.wanderers.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.culture.wanderers.dto.GeminiExtractResponse;
import com.culture.wanderers.dto.UserPreferenceResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.UserActivity;
import com.culture.wanderers.entity.UserPreferenceOption;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.UserActivityRepository;
import com.culture.wanderers.repository.UserPreferenceOptionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PersonalizedRecommendationService {

    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final UserActivityRepository userActivityRepository;
    private final FestivalRepository festivalRepository;
    private final UserPreferenceOptionRepository userPreferenceOptionRepository;

    public List<Festival> recommend(Long userId) {
        return recommend(userId, 10);
    }

    public List<Festival> recommend(Long userId, int limit) {
        return recommendInternal(userId, RecommendationMode.ONGOING, limit);
    }

    public List<Festival> recommendEndingSoon(Long userId) {
        return recommendEndingSoon(userId, 10);
    }

    public List<Festival> recommendEndingSoon(Long userId, int limit) {
        return recommendInternal(userId, RecommendationMode.ENDING_SOON, limit);
    }

    private List<Festival> recommendInternal(Long userId, RecommendationMode mode, int limit) {
        int safeLimit = Math.max(limit, 1);
        List<UserActivity> activities = userActivityRepository.findByUserId(userId);
        List<UserPreferenceOption> selectedOptions = userPreferenceOptionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        if (activities.isEmpty() && selectedOptions.isEmpty()) {
            return festivalRepository.findAll().stream()
                    .filter(f -> matchesMode(f, LocalDate.now(), mode))
                    .limit(safeLimit)
                    .toList();
        }

        Map<String, Integer> regionScore = new HashMap<>();
        Map<String, Integer> categoryScore = new HashMap<>();
        Map<String, Integer> keywordScore = new HashMap<>();

        for (UserActivity act : activities) {
            int weight = getWeight(act.getActionType());
            mergeScore(regionScore, act.getRegion(), weight);
            mergeScore(categoryScore, act.getCategory(), weight);
            mergeScore(keywordScore, act.getKeyword(), weight);
        }

        mergeSelectedPreferenceScores(regionScore, categoryScore, selectedOptions);
        mergeSelectedCategoryKeywords(keywordScore, selectedOptions);

        LocalDate today = LocalDate.now();
        List<Festival> festivals = festivalRepository.findAll();

        return festivals.stream()
                .filter(f -> matchesMode(f, today, mode))
                .filter(f -> activities.stream()
                        .noneMatch(act -> "visited".equals(act.getActionType())
                                && act.getFestivalId() != null
                                && act.getFestivalId().equals(f.getId())))
                .sorted((f1, f2) -> Integer.compare(
                        calculateScore(f2, regionScore, categoryScore, keywordScore),
                        calculateScore(f1, regionScore, categoryScore, keywordScore)
                ))
                .collect(Collectors.toMap(
                        Festival::getId,
                        festival -> festival,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ))
                .values().stream()
                .limit(safeLimit)
                .collect(Collectors.toList());
    }

    public UserPreferenceResponse analyze(Long userId) {
        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<UserPreferenceOption> selectedOptions = userPreferenceOptionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Map<String, Integer> regionScore = new HashMap<>();
        Map<String, Integer> categoryScore = new HashMap<>();
        Map<String, Integer> keywordScore = new HashMap<>();

        for (UserActivity act : activities) {
            int weight = getWeight(act.getActionType());
            mergeScore(regionScore, act.getRegion(), weight);
            mergeScore(categoryScore, act.getCategory(), weight);
            mergeScore(keywordScore, act.getKeyword(), weight);
        }

        mergeSelectedPreferenceScores(regionScore, categoryScore, selectedOptions);
        mergeSelectedCategoryKeywords(keywordScore, selectedOptions);

        List<String> keywords = keywordScore.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();

        List<String> selectedRegions = selectedOptions.stream()
                .filter(option -> UserPreferenceOptionService.TYPE_REGION.equals(option.getPreferenceType()))
                .map(UserPreferenceOption::getPreferenceValue)
                .distinct()
                .toList();

        List<String> selectedCategories = selectedOptions.stream()
                .filter(option -> UserPreferenceOptionService.TYPE_CATEGORY.equals(option.getPreferenceType()))
                .map(UserPreferenceOption::getPreferenceValue)
                .distinct()
                .toList();

        return new UserPreferenceResponse(
                topKey(regionScore),
                topKey(categoryScore),
                keywords,
                activities.size(),
                selectedRegions,
                selectedCategories
        );
    }

    public void applyPreferenceHints(Long userId, GeminiExtractResponse extracted) {
        if (userId == null || extracted == null) {
            return;
        }

        UserPreferenceResponse preference = analyze(userId);
        boolean hasMeaningfulKeywords = extracted.getKeywords() != null
                && extracted.getKeywords().stream().anyMatch(keyword -> keyword != null && !keyword.isBlank());
        boolean hasExplicitCategory = !isBlank(extracted.getCategory());
        boolean hasExplicitRegion = !isBlank(extracted.getRegion());
        boolean hasExplicitDate = !isBlank(extracted.getDate());

        if (isBlank(extracted.getRegion()) && !hasMeaningfulKeywords && !hasExplicitCategory) {
            String regionHint = !preference.getSelectedRegions().isEmpty()
                    ? preference.getSelectedRegions().get(0)
                    : preference.getTopRegion();
            extracted.setRegion(regionHint);
        }

        if (isBlank(extracted.getCategory())
                && !hasMeaningfulKeywords
                && !hasExplicitRegion
                && !hasExplicitDate) {
            String categoryHint = normalizeCategoryHint(!preference.getSelectedCategories().isEmpty()
                    ? preference.getSelectedCategories().get(0)
                    : preference.getTopCategory());
            extracted.setCategory(categoryHint);
        }

        LinkedHashSet<String> keywordHints = new LinkedHashSet<>();
        if (extracted.getKeywords() != null) {
            keywordHints.addAll(extracted.getKeywords());
        }
        if (keywordHints.isEmpty()) {
            keywordHints.addAll(preference.getSelectedCategories());
        }

        extracted.setKeywords(keywordHints.stream().limit(10).toList());
    }

    private int calculateScore(
            Festival festival,
            Map<String, Integer> regionScore,
            Map<String, Integer> categoryScore,
            Map<String, Integer> keywordScore
    ) {
        int score = 0;

        if (festival.getRegion() != null && regionScore.containsKey(festival.getRegion())) {
            score += regionScore.get(festival.getRegion()) * 3;
        }

        if (festival.getCategory() != null && categoryScore.containsKey(festival.getCategory())) {
            score += categoryScore.get(festival.getCategory()) * 3;
        }

        for (String keyword : keywordScore.keySet()) {
            if ((festival.getTitle() != null && festival.getTitle().contains(keyword))
                    || (festival.getCategory() != null && festival.getCategory().contains(keyword))
                    || (festival.getLocation() != null && festival.getLocation().contains(keyword))
                    || (festival.getDescription() != null && festival.getDescription().contains(keyword))) {
                score += keywordScore.get(keyword) * 2;
            }
        }

        return score;
    }

    private void mergeSelectedPreferenceScores(
            Map<String, Integer> regionScore,
            Map<String, Integer> categoryScore,
            List<UserPreferenceOption> selectedOptions
    ) {
        for (UserPreferenceOption option : selectedOptions) {
            if (UserPreferenceOptionService.TYPE_REGION.equals(option.getPreferenceType())) {
                mergeScore(regionScore, option.getPreferenceValue(), 12);
            }
            if (UserPreferenceOptionService.TYPE_CATEGORY.equals(option.getPreferenceType())) {
                mergeScore(categoryScore, option.getPreferenceValue(), 12);
            }
        }
    }

    private void mergeSelectedCategoryKeywords(
            Map<String, Integer> keywordScore,
            List<UserPreferenceOption> selectedOptions
    ) {
        for (UserPreferenceOption option : selectedOptions) {
            if (UserPreferenceOptionService.TYPE_CATEGORY.equals(option.getPreferenceType())) {
                mergeScore(keywordScore, option.getPreferenceValue(), 8);
            }
        }
    }

    private void mergeScore(Map<String, Integer> scores, String key, int weight) {
        if (!isBlank(key)) {
            scores.merge(key, weight, Integer::sum);
        }
    }

    private String topKey(Map<String, Integer> scores) {
        return scores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private int getWeight(String actionType) {
        return switch (actionType) {
            case "search" -> 1;
            case "view" -> 2;
            case "like" -> 4;
            case "visited" -> 5;
            case "review" -> 6;
            case "party_click" -> 3;
            case "party_join" -> 7;
            default -> 1;
        };
    }

    private boolean isOngoing(Festival festival, LocalDate today) {
        try {
            LocalDate start = parseFestivalDate(festival.getStartDate());
            LocalDate end = parseFestivalDate(festival.getEndDate());
            return !today.isBefore(start) && !today.isAfter(end);
        } catch (Exception e) {
            return true;
        }
    }

    private boolean isEndingSoon(Festival festival, LocalDate today) {
        try {
            LocalDate start = parseFestivalDate(festival.getStartDate());
            LocalDate end = parseFestivalDate(festival.getEndDate());

            if (today.isBefore(start) || today.isAfter(end)) {
                return false;
            }

            return !end.isAfter(today.plusDays(14));
        } catch (Exception e) {
            return false;
        }
    }

    private LocalDate parseFestivalDate(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Festival date is blank");
        }

        String normalized = value.trim();
        if (normalized.contains("T")) {
            normalized = normalized.substring(0, normalized.indexOf('T'));
        }

        if (normalized.matches("\\d{8}")) {
            return LocalDate.parse(normalized, COMPACT_DATE_FORMATTER);
        }

        return LocalDate.parse(normalized);
    }

    private boolean matchesMode(Festival festival, LocalDate today, RecommendationMode mode) {
        return switch (mode) {
            case ONGOING -> isOngoing(festival, today);
            case ENDING_SOON -> isEndingSoon(festival, today);
        };
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalizeCategoryHint(String value) {
        if (isBlank(value)) {
            return null;
        }

        if (value.contains("축제") || value.contains("페스티벌") || value.contains("먹거리") || value.contains("야시장")) {
            return "축제";
        }
        if (value.contains("전시") || value.contains("미술관") || value.contains("박물관")) {
            return "전시";
        }
        if (value.contains("공연")) {
            return "공연";
        }
        if (value.contains("체험") || value.contains("플리마켓")) {
            return "체험";
        }
        return null;
    }

    private enum RecommendationMode {
        ONGOING,
        ENDING_SOON
    }
}
