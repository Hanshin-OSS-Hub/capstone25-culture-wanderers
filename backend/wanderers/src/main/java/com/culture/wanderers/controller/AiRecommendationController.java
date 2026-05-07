package com.culture.wanderers.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.culture.wanderers.dto.AiRecommendFestivalItem;
import com.culture.wanderers.dto.AiItineraryItem;
import com.culture.wanderers.dto.AiRecommendRequest;
import com.culture.wanderers.dto.AiRecommendResponse;
import com.culture.wanderers.dto.GeminiExtractResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.UserSave;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.repository.UserSaveRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.service.FestivalSearchService;
import com.culture.wanderers.service.GeminiRecommendationService;
import com.culture.wanderers.service.GeminiValidationService;
import com.culture.wanderers.service.PersonalizedRecommendationService;
import com.culture.wanderers.service.TourApiFestivalService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/ai")
public class AiRecommendationController {

    private static final Map<String, String> EXPLICIT_REGION_ALIASES = createExplicitRegionAliases();

    private final GeminiRecommendationService geminiRecommendationService;
    private final GeminiValidationService geminiValidationService;
    private final FestivalSearchService festivalSearchService;
    private final PersonalizedRecommendationService personalizedRecommendationService;
    private final ReviewRepository reviewRepository;
    private final PartyRepository partyRepository;
    private final UserRepository userRepository;
    private final UserSaveRepository userSaveRepository;
    private final FestivalRepository festivalRepository;
    private final TourApiFestivalService tourApiFestivalService;

    public AiRecommendationController(
            GeminiRecommendationService geminiRecommendationService,
            GeminiValidationService geminiValidationService,
            FestivalSearchService festivalSearchService,
            PersonalizedRecommendationService personalizedRecommendationService,
            ReviewRepository reviewRepository,
            PartyRepository partyRepository,
            UserRepository userRepository,
            UserSaveRepository userSaveRepository,
            FestivalRepository festivalRepository,
            TourApiFestivalService tourApiFestivalService
    ) {
        this.geminiRecommendationService = geminiRecommendationService;
        this.geminiValidationService = geminiValidationService;
        this.festivalSearchService = festivalSearchService;
        this.personalizedRecommendationService = personalizedRecommendationService;
        this.reviewRepository = reviewRepository;
        this.partyRepository = partyRepository;
        this.userRepository = userRepository;
        this.userSaveRepository = userSaveRepository;
        this.festivalRepository = festivalRepository;
        this.tourApiFestivalService = tourApiFestivalService;
    }

    @PostMapping("/recommend")
    public AiRecommendResponse recommend(
            @AuthenticationPrincipal String email,
            @RequestBody AiRecommendRequest request
    ) {
        if (request == null || request.getQuery() == null || request.getQuery().isBlank()) {
            throw new IllegalArgumentException("query is required");
        }

        boolean fallbackUsed = false;
        GeminiExtractResponse extracted;
        Long userId = resolveUserId(email);
        int limit = resolveLimit(request);
        List<Long> excludeIds = request.getExcludeIds() == null ? List.of() : request.getExcludeIds();
        List<String> requestedCategories = normalizeRequestedCategories(request.getCategories());

        if (request.getTargetFestivalId() != null) {
            Festival targetFestival = festivalRepository.findById(request.getTargetFestivalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Festival not found"));
            List<Festival> targetFestivals = List.of(targetFestival);

            return new AiRecommendResponse(
                    request.getQuery(),
                    null,
                    toRecommendItems(targetFestivals),
                    buildItineraryIfRequested(request.getQuery(), targetFestivals),
                    toRecommendItems(findNearbyCultureEvents(targetFestival, extractNearbyArea(targetFestival.getLocation(), targetFestival.getRegion()), 12)),
                    false,
                    "Selected festival itinerary."
            );
        }

        try {
            GeminiExtractResponse raw = geminiRecommendationService.extractConditions(request.getQuery());
            extracted = geminiValidationService.validateAndNormalize(raw, request.getQuery());
            applyExplicitRegionFromQuery(extracted, request.getQuery());
            personalizedRecommendationService.applyPreferenceHints(userId, extracted);
        } catch (Exception e) {
            fallbackUsed = true;
            e.printStackTrace();

            extracted = geminiValidationService.validateAndNormalize(null, request.getQuery());
            applyExplicitRegionFromQuery(extracted, request.getQuery());
            personalizedRecommendationService.applyPreferenceHints(userId, extracted);

            List<Festival> fallbackFestivals = festivalSearchService.searchByExtractedConditions(extracted, limit + excludeIds.size());
            fallbackFestivals = mergeExternalFestivals(extracted, request.getQuery(), fallbackFestivals, limit + excludeIds.size());
            fallbackFestivals = mergeSavedFestivals(email, extracted, request.getQuery(), fallbackFestivals, limit + excludeIds.size());
            fallbackFestivals = filterByRequestedCategories(fallbackFestivals, requestedCategories);
            fallbackFestivals = rankCourseCandidatesIfNeeded(request.getQuery(), fallbackFestivals);
            fallbackFestivals = applyExcludeAndLimit(fallbackFestivals, excludeIds, limit);
            fallbackFestivals = fillRelaxedCandidatesIfNeeded(fallbackFestivals, extracted, excludeIds, limit, requestedCategories);
            fallbackFestivals = filterByRequestedCategories(fallbackFestivals, requestedCategories);
            fallbackFestivals = rankCourseCandidatesIfNeeded(request.getQuery(), fallbackFestivals);
            fallbackFestivals = applyExcludeAndLimit(fallbackFestivals, excludeIds, limit);
            List<AiRecommendFestivalItem> fallbackItems = toRecommendItems(fallbackFestivals);
            List<AiItineraryItem> fallbackItinerary = buildItineraryIfRequested(request.getQuery(), fallbackFestivals);

            return new AiRecommendResponse(
                    request.getQuery(),
                    extracted,
                    fallbackItems,
                    fallbackItinerary,
                    toRecommendItems(findNearbyFestivalsForItinerary(fallbackFestivals)),
                    true,
                    "AI response is temporarily delayed, so fallback recommendations are shown."
            );
        }

        List<Festival> festivals = festivalSearchService.searchByExtractedConditions(extracted, limit + excludeIds.size());
        festivals = mergeExternalFestivals(extracted, request.getQuery(), festivals, limit + excludeIds.size());
        festivals = mergeSavedFestivals(email, extracted, request.getQuery(), festivals, limit + excludeIds.size());
        festivals = filterByRequestedCategories(festivals, requestedCategories);
        festivals = rankCourseCandidatesIfNeeded(request.getQuery(), festivals);
        festivals = applyExcludeAndLimit(festivals, excludeIds, limit);
        festivals = fillRelaxedCandidatesIfNeeded(festivals, extracted, excludeIds, limit, requestedCategories);
        festivals = filterByRequestedCategories(festivals, requestedCategories);
        festivals = rankCourseCandidatesIfNeeded(request.getQuery(), festivals);
        festivals = applyExcludeAndLimit(festivals, excludeIds, limit);
        List<AiRecommendFestivalItem> items = toRecommendItems(festivals);
        List<AiItineraryItem> itinerary = buildItineraryIfRequested(request.getQuery(), festivals);

        return new AiRecommendResponse(
                request.getQuery(),
                extracted,
                items,
                itinerary,
                toRecommendItems(findNearbyFestivalsForItinerary(festivals)),
                fallbackUsed,
                fallbackUsed ? "Fallback search was used." : "Recommendation results."
        );
    }

    private List<String> normalizeRequestedCategories(List<String> categories) {
        if (categories == null) {
            return List.of();
        }

        return categories.stream()
                .filter(category -> category != null && !category.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
    }

    private List<Festival> filterByRequestedCategories(List<Festival> festivals, List<String> requestedCategories) {
        if (festivals == null || festivals.isEmpty() || requestedCategories == null || requestedCategories.isEmpty()) {
            return festivals;
        }

        return festivals.stream()
                .filter(festival -> matchesAnyRequestedCategory(festival, requestedCategories))
                .toList();
    }

    private boolean matchesAnyRequestedCategory(Festival festival, List<String> requestedCategories) {
        if (festival == null) {
            return false;
        }

        String text = normalizeSearchText(String.join(" ",
                nullToBlank(festival.getTitle()),
                nullToBlank(festival.getCategory()),
                nullToBlank(festival.getDescription()),
                nullToBlank(festival.getLocation()),
                nullToBlank(festival.getRegion())
        ));

        return requestedCategories.stream().anyMatch(category -> matchesRequestedCategoryText(text, category));
    }

    private boolean matchesRequestedCategoryText(String text, String category) {
        String normalizedCategory = normalizeSearchText(category);

        if (normalizedCategory.contains("전시") || normalizedCategory.contains("미술")) {
            return matchesAny(text, "전시", "미술", "미술관", "갤러리", "아트", "작가", "화랑", "공예", "사진", "회화", "설치");
        }
        if (normalizedCategory.contains("박물관") || normalizedCategory.contains("역사")) {
            return matchesAny(text, "박물관", "역사", "유적", "유산", "궁", "고궁", "왕궁", "기념관", "문화재", "사적", "고분", "성곽", "민속");
        }
        if (normalizedCategory.contains("공연") || normalizedCategory.contains("콘서트")) {
            return matchesAny(text, "공연", "콘서트", "음악", "뮤지컬", "연극", "무대", "오페라", "국악", "클래식", "밴드");
        }
        if (normalizedCategory.contains("축제") || normalizedCategory.contains("페스티벌")) {
            return matchesAny(text, "축제", "페스티벌", "festival", "마을축제", "문화제");
        }
        if (normalizedCategory.contains("전통문화")) {
            return matchesAny(text, "전통", "한복", "국악", "민속", "문화재", "궁", "고궁", "한옥", "다례");
        }
        if (normalizedCategory.contains("체험") || normalizedCategory.contains("클래스")) {
            return matchesAny(text, "체험", "클래스", "워크숍", "만들기", "교육", "실습", "공방");
        }
        if (normalizedCategory.contains("마켓") || normalizedCategory.contains("플리마켓")) {
            return matchesAny(text, "마켓", "플리마켓", "장터", "시장", "판매", "셀러");
        }
        if (normalizedCategory.contains("푸드") || normalizedCategory.contains("먹거리")) {
            return matchesAny(text, "푸드", "먹거리", "음식", "맛", "요리", "식문화", "디저트");
        }
        if (normalizedCategory.contains("야외") || normalizedCategory.contains("산책")) {
            return matchesAny(text, "야외", "산책", "공원", "광장", "거리", "둘레길", "정원");
        }
        if (normalizedCategory.contains("가족") || normalizedCategory.contains("어린이")) {
            return matchesAny(text, "가족", "어린이", "아이", "키즈", "유아", "아동");
        }
        if (normalizedCategory.contains("데이트") || normalizedCategory.contains("야간")) {
            return matchesAny(text, "데이트", "야간", "밤", "나이트", "라이트", "조명");
        }

        return text.contains(normalizedCategory);
    }

    private void applyExplicitRegionFromQuery(GeminiExtractResponse extracted, String query) {
        if (extracted == null || query == null || query.isBlank()) {
            return;
        }

        String normalized = normalizeQueryForRegion(query);
        for (Map.Entry<String, String> entry : EXPLICIT_REGION_ALIASES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                extracted.setRegion(entry.getValue());
                return;
            }
        }
    }

    private String normalizeQueryForRegion(String query) {
        return query.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    private static Map<String, String> createExplicitRegionAliases() {
        Map<String, String> aliases = new LinkedHashMap<>();
        aliases.put("\uB0A8\uC591\uC8FC\uC2DC", "\uB0A8\uC591\uC8FC");
        aliases.put("\uB0A8\uC591\uC8FC", "\uB0A8\uC591\uC8FC");
        aliases.put("\u00EB\u0082\u00A8\u00EC\u0096\u0091\u00EC\u00A3\u00BC", "\uB0A8\uC591\uC8FC");
        aliases.put("\uC591\uC8FC\uC2DC", "\uC591\uC8FC");
        aliases.put("\uC591\uC8FC", "\uC591\uC8FC");
        aliases.put("\u00EC\u0096\u0091\u00EC\u00A3\u00BC", "\uC591\uC8FC");

        aliases.put("\uC131\uC218\uB3D9", "\uC131\uC218\uB3D9");
        aliases.put("\uC131\uC218", "\uC131\uC218\uB3D9");
        aliases.put("\u00EC\u0084\u00B1\u00EC\u0088\u0098", "\uC131\uC218\uB3D9");

        addSeoulDistrictAlias(aliases, "\uAC15\uB0A8");
        addSeoulDistrictAlias(aliases, "\uAC15\uBD81");
        addSeoulDistrictAlias(aliases, "\uAC15\uB3D9");
        addSeoulDistrictAlias(aliases, "\uAC15\uC11C");
        addSeoulDistrictAlias(aliases, "\uAD00\uC545");
        addSeoulDistrictAlias(aliases, "\uAD11\uC9C4");
        addSeoulDistrictAlias(aliases, "\uAD6C\uB85C");
        addSeoulDistrictAlias(aliases, "\uAE08\uCC9C");
        addSeoulDistrictAlias(aliases, "\uB178\uC6D0");
        addSeoulDistrictAlias(aliases, "\uB3C4\uBD09");
        addSeoulDistrictAlias(aliases, "\uB3D9\uB300\uBB38");
        addSeoulDistrictAlias(aliases, "\uB9C8\uD3EC");
        addSeoulDistrictAlias(aliases, "\uC11C\uB300\uBB38");
        addSeoulDistrictAlias(aliases, "\uC11C\uCD08");
        addSeoulDistrictAlias(aliases, "\uC131\uB3D9");
        addSeoulDistrictAlias(aliases, "\uC131\uBD81");
        addSeoulDistrictAlias(aliases, "\uC1A1\uD30C");
        addSeoulDistrictAlias(aliases, "\uC591\uCC9C");
        addSeoulDistrictAlias(aliases, "\uC601\uB4F1\uD3EC");
        addSeoulDistrictAlias(aliases, "\uC6A9\uC0B0");
        addSeoulDistrictAlias(aliases, "\uC740\uD3C9");
        addSeoulDistrictAlias(aliases, "\uC885\uB85C");

        aliases.put("\uC911\uAD6C", "\uC911\uAD6C");
        aliases.put("\uBA85\uB3D9", "\uC911\uAD6C");
        aliases.put("\uD64D\uB300", "\uB9C8\uD3EC\uAD6C");
        aliases.put("\uC5F0\uB0A8", "\uB9C8\uD3EC\uAD6C");
        aliases.put("\uC774\uD0DC\uC6D0", "\uC6A9\uC0B0\uAD6C");
        aliases.put("\uD55C\uB0A8", "\uC6A9\uC0B0\uAD6C");
        aliases.put("\uC778\uC0AC\uB3D9", "\uC885\uB85C\uAD6C");
        aliases.put("\uB300\uD559\uB85C", "\uC885\uB85C\uAD6C");
        aliases.put("\uC7A0\uC2E4", "\uC1A1\uD30C\uAD6C");
        aliases.put("\uC5EC\uC758\uB3C4", "\uC601\uB4F1\uD3EC\uAD6C");
        return aliases;
    }

    private static void addSeoulDistrictAlias(Map<String, String> aliases, String shortName) {
        aliases.put(shortName + "\uAD6C", shortName + "\uAD6C");
        aliases.put(shortName, shortName + "\uAD6C");
    }

    private List<Festival> mergeExternalFestivals(
            GeminiExtractResponse extracted,
            String query,
            List<Festival> searchedFestivals,
            int limit
    ) {
        List<Festival> externalFestivals = tourApiFestivalService.fetchAndSave(extracted, query, limit);
        if (externalFestivals.isEmpty()) {
            return searchedFestivals;
        }

        Map<Long, Festival> merged = new LinkedHashMap<>();
        externalFestivals.forEach(festival -> merged.put(festival.getId(), festival));
        searchedFestivals.forEach(festival -> merged.putIfAbsent(festival.getId(), festival));

        return merged.values().stream().limit(Math.max(limit, 1)).toList();
    }

    private List<AiRecommendFestivalItem> toRecommendItems(List<Festival> festivals) {
        return festivals.stream()
                .map(festival -> {
                    long reviewCount = reviewRepository.countByTargetTypeAndTargetId("festival", festival.getId());
                    long partyCount = partyRepository.countByFestivalIdAndStatus(
                            Long.valueOf(festival.getId()),
                            "RECRUITING"
                    );

                    return new AiRecommendFestivalItem(festival, reviewCount, partyCount);
                })
                .toList();
    }

    private Long resolveUserId(String email) {
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return 1L;
        }

        return userRepository.findByEmail(email)
                .map(user -> user.getId().longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private List<Festival> mergeSavedFestivals(
            String email,
            GeminiExtractResponse extracted,
            String query,
            List<Festival> searchedFestivals,
            int limit
    ) {
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return searchedFestivals;
        }

        List<Long> savedFestivalIds = userSaveRepository.findByUserEmail(email).stream()
                .filter(save -> "festival".equalsIgnoreCase(save.getTargetType()))
                .map(UserSave::getTargetId)
                .toList();

        if (savedFestivalIds.isEmpty()) {
            return searchedFestivals;
        }

        List<Festival> savedFestivals = festivalRepository.findAllById(savedFestivalIds).stream()
                .filter(festival -> matchesSavedFestivalHint(festival, extracted, query))
                .toList();

        if (savedFestivals.isEmpty()) {
            return searchedFestivals;
        }

        Map<String, Festival> merged = new LinkedHashMap<>();
        savedFestivals.forEach(festival -> merged.put(recommendationUniqueKey(festival), festival));
        searchedFestivals.forEach(festival -> merged.putIfAbsent(recommendationUniqueKey(festival), festival));

        return merged.values().stream().limit(Math.max(limit, 1)).toList();
    }

    private List<Festival> applyExcludeAndLimit(List<Festival> festivals, List<Long> excludeIds, int limit) {
        Set<Long> excluded = excludeIds == null ? Set.of() : Set.copyOf(excludeIds);
        Set<String> excludedKeys = excluded.isEmpty()
                ? Set.of()
                : festivalRepository.findAllById(excluded).stream()
                        .map(this::recommendationUniqueKey)
                        .collect(java.util.stream.Collectors.toSet());

        return festivals.stream()
                .filter(festival -> !excluded.contains(festival.getId()))
                .filter(festival -> !excludedKeys.contains(recommendationUniqueKey(festival)))
                .collect(java.util.stream.Collectors.toMap(
                        this::recommendationUniqueKey,
                        festival -> festival,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ))
                .values().stream()
                .limit(Math.max(limit, 1))
                .toList();
    }

    private List<Festival> rankCourseCandidatesIfNeeded(String query, List<Festival> festivals) {
        if (!isItineraryRequest(query) || festivals == null || festivals.size() <= 1) {
            return festivals;
        }

        String normalizedQuery = normalizeSearchText(query);
        return festivals.stream()
                .sorted(Comparator.comparingInt((Festival festival) -> courseCandidateScore(festival, normalizedQuery)).reversed())
                .toList();
    }

    private int courseCandidateScore(Festival festival, String normalizedQuery) {
        String text = normalizeSearchText(String.join(" ",
                nullToBlank(festival.getTitle()),
                nullToBlank(festival.getCategory()),
                nullToBlank(festival.getRegion()),
                nullToBlank(festival.getLocation()),
                nullToBlank(festival.getDescription()),
                nullToBlank(festival.getPrice())
        ));

        int score = 0;
        if (isRainyCourse(normalizedQuery) && isIndoorFriendly(text)) score += 40;
        if (isSunnyCourse(normalizedQuery) && matchesAny(text, "야외", "산책", "공원", "거리", "광장", "마켓", "축제")) score += 26;
        if (isHotCourse(normalizedQuery) && isIndoorFriendly(text)) score += 28;
        if (isMinimalMoveCourse(normalizedQuery)) score += compactAreaScore(festival);
        if (isWalkFocusedCourse(normalizedQuery)) score += 12;
        if (isCoupleCourse(normalizedQuery) && matchesAny(text, "전시", "미술", "공연", "카페", "야경", "정원")) score += 18;
        if (isSoloCourse(normalizedQuery) && matchesAny(text, "전시", "미술관", "박물관", "책", "강연", "체험")) score += 16;
        if (isFriendCourse(normalizedQuery) && matchesAny(text, "축제", "페스티벌", "체험", "플리마켓", "공연")) score += 16;
        if (isFamilyCourse(normalizedQuery) && matchesAny(text, "가족", "어린이", "체험", "박물관", "공원")) score += 18;

        Integer budget = extractBudgetMax(normalizedQuery);
        if (budget != null) {
            Integer price = estimateFestivalPrice(festival);
            if (price != null && price <= budget) score += 20;
            if (price != null && price > budget) score -= 45;
        }

        return score;
    }

    private List<Festival> fillRelaxedCandidatesIfNeeded(
            List<Festival> current,
            GeminiExtractResponse extracted,
            List<Long> excludeIds,
            int limit,
            List<String> requestedCategories
    ) {
        if (current.size() >= limit || extracted == null || extracted.getKeywords() == null || extracted.getKeywords().isEmpty()) {
            return current;
        }

        GeminiExtractResponse relaxed = new GeminiExtractResponse();
        relaxed.setIntent(extracted.getIntent());
        relaxed.setRegion(extracted.getRegion());
        relaxed.setCompanions(extracted.getCompanions());
        relaxed.setCategory(extracted.getCategory());
        relaxed.setDate(extracted.getDate());
        relaxed.setPriceMax(extracted.getPriceMax());
        relaxed.setKeywords(List.of());

        Set<Long> blockedIds = new java.util.HashSet<>();
        if (excludeIds != null) {
            blockedIds.addAll(excludeIds);
        }
        current.forEach(festival -> blockedIds.add(festival.getId()));

        List<Festival> additional = festivalSearchService
                .searchByExtractedConditions(relaxed, limit + blockedIds.size() + 10)
                .stream()
                .filter(festival -> !blockedIds.contains(festival.getId()))
                .filter(festival -> requestedCategories == null || requestedCategories.isEmpty()
                        || matchesAnyRequestedCategory(festival, requestedCategories))
                .toList();

        Map<String, Festival> merged = new LinkedHashMap<>();
        current.forEach(festival -> merged.put(recommendationUniqueKey(festival), festival));
        additional.forEach(festival -> merged.putIfAbsent(recommendationUniqueKey(festival), festival));

        return merged.values().stream().limit(limit).toList();
    }

    private int resolveLimit(AiRecommendRequest request) {
        if (request.getLimit() == null) {
            return 5;
        }
        return Math.min(Math.max(request.getLimit(), 1), 20);
    }

    private boolean matchesSavedFestivalHint(Festival festival, GeminiExtractResponse extracted, String query) {
        if (festival == null) {
            return false;
        }

        boolean dateMatches = extracted == null || extracted.getDate() == null || extracted.getDate().isBlank()
                || isFestivalOpenOn(festival, extracted.getDate());
        if (!dateMatches) {
            return false;
        }

        if (!matchesExplicitRegion(festival, extracted)) {
            return false;
        }

        if (!matchesExplicitCategory(festival, extracted)) {
            return false;
        }

        if (!matchesExplicitPrice(festival, extracted)) {
            return false;
        }

        Set<String> keywords = extracted != null && extracted.getKeywords() != null
                ? extracted.getKeywords().stream()
                        .filter(keyword -> keyword != null && !keyword.isBlank())
                        .collect(java.util.stream.Collectors.toSet())
                : Set.of();

        boolean hasUsefulKeyword = keywords.stream().anyMatch(keyword -> keyword != null
                && !keyword.isBlank()
                && !List.of("추천", "행사", "축제", "코스", "하루", "일정").contains(keyword.trim()));

        if (!hasUsefulKeyword) {
            return true;
        }

        String haystack = normalizeSearchText(String.join(" ",
                nullToBlank(festival.getTitle()),
                nullToBlank(festival.getCategory()),
                nullToBlank(festival.getRegion()),
                nullToBlank(festival.getLocation()),
                nullToBlank(festival.getDescription())
        ));

        for (String keyword : keywords) {
            String normalized = normalizeSearchText(keyword);
            if (!normalized.isBlank() && haystack.contains(normalized)) {
                return true;
            }
        }

        return normalizeSearchText(query).contains(normalizeSearchText(festival.getTitle()));
    }

    private boolean matchesExplicitRegion(Festival festival, GeminiExtractResponse extracted) {
        if (extracted == null || extracted.getRegion() == null || extracted.getRegion().isBlank()) {
            return true;
        }

        String region = normalizeSearchText(extracted.getRegion());
        String target = normalizeSearchText(String.join(" ",
                nullToBlank(festival.getRegion()),
                nullToBlank(festival.getLocation())
        ));

        return !region.isBlank() && target.contains(region);
    }

    private boolean matchesExplicitCategory(Festival festival, GeminiExtractResponse extracted) {
        if (extracted == null || extracted.getCategory() == null || extracted.getCategory().isBlank()) {
            return true;
        }

        return normalizeSearchText(festival.getCategory()).contains(normalizeSearchText(extracted.getCategory()));
    }

    private boolean matchesExplicitPrice(Festival festival, GeminiExtractResponse extracted) {
        if (extracted == null || extracted.getPriceMax() == null) {
            return true;
        }

        Integer estimatedPrice = estimateFestivalPrice(festival);
        if (extracted.getPriceMax() > 0) {
            return estimatedPrice == null || estimatedPrice <= extracted.getPriceMax();
        }

        String target = normalizeSearchText(String.join(" ",
                nullToBlank(festival.getPrice()),
                nullToBlank(festival.getDescription())
        ));

        if (estimatedPrice != null && estimatedPrice == 0) {
            return true;
        }

        return target.contains("무료")
                || target.contains("입장료없음")
                || target.contains("0원");
    }

    private Integer estimateFestivalPrice(Festival festival) {
        if (festival == null) {
            return null;
        }

        String text = normalizeSearchText(String.join(" ",
                nullToBlank(festival.getPrice()),
                nullToBlank(festival.getDescription())
        ));

        if (text.contains("무료") || text.contains("입장료없음") || text.contains("0원")) {
            return 0;
        }

        java.util.regex.Matcher tenThousandMatcher = java.util.regex.Pattern
                .compile("(\\d+)만원")
                .matcher(text);
        if (tenThousandMatcher.find()) {
            return Integer.parseInt(tenThousandMatcher.group(1)) * 10000;
        }

        java.util.regex.Matcher wonMatcher = java.util.regex.Pattern
                .compile("(\\d{1,3}(?:,?\\d{3})*)원")
                .matcher(text);
        if (wonMatcher.find()) {
            return Integer.parseInt(wonMatcher.group(1).replace(",", ""));
        }

        return null;
    }

    private Integer extractBudgetMax(String normalizedQuery) {
        if (normalizedQuery.contains("무료")) return 0;
        if (normalizedQuery.contains("1만원이하") || normalizedQuery.contains("10000원이하")) return 10000;
        if (normalizedQuery.contains("3만원이하") || normalizedQuery.contains("30000원이하")) return 30000;

        java.util.regex.Matcher tenThousandMatcher = java.util.regex.Pattern
                .compile("(\\d+)만원이하")
                .matcher(normalizedQuery);
        if (tenThousandMatcher.find()) {
            return Integer.parseInt(tenThousandMatcher.group(1)) * 10000;
        }

        return null;
    }

    private boolean isRainyCourse(String normalizedQuery) {
        return normalizedQuery.contains("비오는날") || normalizedQuery.contains("실내");
    }

    private boolean isHotCourse(String normalizedQuery) {
        return normalizedQuery.contains("더운날") || normalizedQuery.contains("짧은도보");
    }

    private boolean isSunnyCourse(String normalizedQuery) {
        return normalizedQuery.contains("화창한날") || normalizedQuery.contains("야외산책");
    }

    private boolean isMinimalMoveCourse(String normalizedQuery) {
        return normalizedQuery.contains("이동적게") || normalizedQuery.contains("이동시간최소화");
    }

    private boolean isWalkFocusedCourse(String normalizedQuery) {
        return normalizedQuery.contains("도보위주") || normalizedQuery.contains("15분안팎");
    }

    private boolean isCoupleCourse(String normalizedQuery) {
        return normalizedQuery.contains("데이트") || normalizedQuery.contains("연인") || normalizedQuery.contains("커플");
    }

    private boolean isSoloCourse(String normalizedQuery) {
        return normalizedQuery.contains("혼자") || normalizedQuery.contains("solo");
    }

    private boolean isFriendCourse(String normalizedQuery) {
        return normalizedQuery.contains("친구");
    }

    private boolean isFamilyCourse(String normalizedQuery) {
        return normalizedQuery.contains("가족");
    }

    private boolean isIndoorFriendly(String normalizedText) {
        return matchesAny(normalizedText, "실내", "전시", "전시회", "공연", "미술관", "박물관", "갤러리", "아트", "센터");
    }

    private boolean matchesAny(String normalizedText, String... keywords) {
        for (String keyword : keywords) {
            if (normalizedText.contains(normalizeSearchText(keyword))) {
                return true;
            }
        }
        return false;
    }

    private int compactAreaScore(Festival festival) {
        String location = nullToBlank(festival.getLocation());
        if (location.contains("동") || location.contains("로") || location.contains("길")) {
            return 18;
        }
        return 8;
    }

    private List<AiItineraryItem> buildItineraryIfRequested(String query, List<Festival> festivals) {
        if (!isItineraryRequest(query) || festivals == null || festivals.isEmpty()) {
            return List.of();
        }

        Festival main = festivals.get(0);
        String title = nullToBlank(main.getTitle());
        String location = !nullToBlank(main.getLocation()).isBlank()
                ? main.getLocation()
                : main.getRegion();
        String area = !nullToBlank(main.getRegion()).isBlank()
                ? main.getRegion()
                : location;
        String requestedArea = extractRequestedCourseArea(query);
        String nearbyArea = !requestedArea.isBlank()
                ? requestedArea
                : extractNearbyArea(location, area);
        String normalizedQuery = normalizeSearchText(query);
        boolean rainyDay = normalizedQuery.contains("비오는날") || normalizedQuery.contains("실내");
        boolean hotDay = normalizedQuery.contains("더운날") || normalizedQuery.contains("짧은도보");
        boolean cafeOnly = normalizedQuery.contains("카페만");
        boolean skipMeal = normalizedQuery.contains("식사일정제외") || normalizedQuery.contains("식사제외");
        boolean minimalMove = isMinimalMoveCourse(normalizedQuery);
        boolean walkFocused = isWalkFocusedCourse(normalizedQuery);
        boolean transitUnderThirty = normalizedQuery.contains("대중교통30분이하");
        Integer budgetMax = extractBudgetMax(normalizedQuery);
        int mealCost = skipMeal ? 0 : cafeOnly ? 8000 : 18000;
        int cafeCost = cafeOnly ? 12000 : 7000;
        Integer mainPrice = estimateFestivalPrice(main);
        int estimatedTotal = (mainPrice == null ? 0 : mainPrice) + mealCost + cafeCost;
        String movementGuide = minimalMove
                ? "동선을 한 동네 안으로 좁혀 이동 시간을 줄였어요."
                : walkFocused
                ? "장소 간 이동은 도보 15분 안팎을 우선으로 잡았어요."
                : transitUnderThirty
                ? "장소 간 대중교통 이동은 30분 이하가 되도록 구성했어요."
                : "지도 링크에서 세부 이동 시간을 확인할 수 있어요.";
        String companionGuide = isCoupleCourse(normalizedQuery)
                ? "데이트 분위기를 고려해 여유 있는 감상과 카페 시간을 넣었어요."
                : isSoloCourse(normalizedQuery)
                ? "혼자 보기 편한 전시, 산책, 휴식 중심으로 잡았어요."
                : isFriendCourse(normalizedQuery)
                ? "친구와 이야기하기 좋은 체험, 축제, 식사 동선을 강조했어요."
                : isFamilyCourse(normalizedQuery)
                ? "가족이 함께 움직이기 편한 실내·체험형 동선을 우선했어요."
                : "동행 유형에 맞춰 시간을 여유 있게 배치했어요.";
        String budgetGuide = budgetMax == null
                ? "예산 제한 없이 편한 동선으로 구성했어요."
                : "예상 비용 약 " + estimatedTotal + "원 / 목표 예산 " + budgetMax + "원 기준으로 구성했어요.";
        String firstStopTitle = rainyDay || hotDay ? "실내 카페에서 출발 준비" : "근처 카페에서 출발 준비";
        String firstStopDescription = rainyDay
                ? "비 오는 날을 고려해 실내에서 만나 이동 동선과 예매 정보를 확인해요."
                : hotDay
                ? "더운 날을 고려해 실내에서 쉬면서 짧은 이동 동선을 확인해요."
                : "행사장 주변 카페에서 만나 이동 동선과 예매 정보를 확인해요.";
        firstStopDescription = firstStopDescription + " " + movementGuide + " " + budgetGuide;
        String lunchTitle = skipMeal ? "가벼운 이동 정리" : cafeOnly ? "카페 휴식" : "점심 식사";
        String lunchDescription = skipMeal
                ? "식사 일정은 제외하고 행사장까지 이동하기 좋은 동선으로 정리했어요."
                : cafeOnly
                ? "식사 대신 카페에서 쉬면서 다음 일정까지 여유를 확보해요."
                : "행사장과 가까운 식당을 골라 대기 시간을 줄이는 코스예요.";
        lunchDescription = lunchDescription + " " + companionGuide;
        String lunchKeyword = skipMeal ? nearbyArea + " 산책" : cafeOnly ? nearbyArea + " 카페" : nearbyArea + " 맛집";
        String lateStopTitle = rainyDay ? "실내 문화행사 선택" : "주변 문화행사 선택";
        String lateStopLocation = rainyDay ? nearbyArea + " 실내 전시 공연" : nearbyArea + " 문화행사";
        String lateStopDescription = rainyDay
                ? "비 오는 날이라 전시, 공연, 미술관, 박물관처럼 실내에서 이어갈 수 있는 후보를 우선 추천해요."
                : "아래 후보 중 하나를 추가하면 이 시간대 코스에 바로 반영돼요.";
        String dinnerTitle = skipMeal ? "귀가" : "저녁 식사 후 귀가";
        String dinnerDescription = skipMeal
                ? "식사 없이 이동 시간을 줄여 하루 코스를 마무리해요."
                : "저녁 장소까지 잡아 하루 코스로 마무리해요. 지도 링크에서 세부 동선을 확인할 수 있어요.";
        String dinnerLocation = skipMeal ? nearbyArea : nearbyArea + " 저녁 맛집";

        return List.of(
                new AiItineraryItem(
                        "10:30",
                        firstStopTitle,
                        firstStopDescription,
                        nearbyArea + " 카페",
                        naverMapSearchUrl(nearbyArea + " 카페")
                ),
                new AiItineraryItem(
                        "12:00",
                        lunchTitle,
                        lunchDescription,
                        lunchKeyword,
                        naverMapSearchUrl(lunchKeyword)
                ),
                new AiItineraryItem(
                        "14:00",
                        title + " 관람",
                        "저장/관심 데이터와 요청 조건을 기준으로 메인 일정으로 잡았어요.",
                        location,
                        naverMapSearchUrl(!title.isBlank() ? title : location)
                ),
                new AiItineraryItem(
                        "17:00",
                        lateStopTitle,
                        lateStopDescription,
                        lateStopLocation,
                        naverMapSearchUrl(lateStopLocation)
                ),
                new AiItineraryItem(
                        "19:00",
                        dinnerTitle,
                        dinnerDescription,
                        dinnerLocation,
                        naverMapSearchUrl(dinnerLocation)
                )
        );
    }

    private boolean isItineraryRequest(String query) {
        String normalized = query == null ? "" : query.toLowerCase(Locale.ROOT);
        return normalized.contains("코스")
                || normalized.contains("하루")
                || normalized.contains("일정")
                || normalized.contains("동선")
                || normalized.contains("짜줘")
                || normalized.contains("루트");
    }

    private boolean isFestivalOpenOn(Festival festival, String yyyymmdd) {
        try {
            LocalDate target = LocalDate.parse(yyyymmdd, DateTimeFormatter.BASIC_ISO_DATE);
            LocalDate start = LocalDate.parse(festival.getStartDate(), DateTimeFormatter.BASIC_ISO_DATE);
            LocalDate end = LocalDate.parse(festival.getEndDate(), DateTimeFormatter.BASIC_ISO_DATE);
            return !target.isBefore(start) && !target.isAfter(end);
        } catch (Exception e) {
            return true;
        }
    }

    private String naverMapSearchUrl(String keyword) {
        return "https://map.naver.com/p/search/" + URLEncoder.encode(keyword, StandardCharsets.UTF_8);
    }

    private String extractNearbyArea(String location, String fallbackArea) {
        String source = !nullToBlank(location).isBlank() ? location : fallbackArea;
        String normalized = source
                .replaceAll("\\([^)]*\\)", " ")
                .replaceAll(",", " ")
                .replaceAll("\\s+", " ")
                .trim();

        if (normalized.isBlank()) {
            return fallbackArea;
        }

        String[] parts = normalized.split(" ");
        if (parts.length >= 2) {
            return parts[0] + " " + parts[1];
        }

        return normalized;
    }

    private String extractRequestedCourseArea(String query) {
        String normalized = normalizeSearchText(query);
        Map<String, String> preciseAreas = new LinkedHashMap<>();
        preciseAreas.put("종로3가", "종로3가");
        preciseAreas.put("종로", "종로3가");
        preciseAreas.put("인사동", "인사동");
        preciseAreas.put("대학로", "대학로");
        preciseAreas.put("홍대입구", "홍대입구");
        preciseAreas.put("홍대", "홍대입구");
        preciseAreas.put("연남", "연남동");
        preciseAreas.put("성수동", "성수동");
        preciseAreas.put("성수", "성수동");
        preciseAreas.put("강남역", "강남역");
        preciseAreas.put("강남", "강남역");
        preciseAreas.put("잠실", "잠실");
        preciseAreas.put("이태원", "이태원");
        preciseAreas.put("한남", "한남동");
        preciseAreas.put("명동", "명동");
        preciseAreas.put("여의도", "여의도");

        for (Map.Entry<String, String> entry : preciseAreas.entrySet()) {
            if (normalized.contains(normalizeSearchText(entry.getKey()))) {
                return entry.getValue();
            }
        }

        return "";
    }

    private List<Festival> findNearbyFestivalsForItinerary(List<Festival> festivals) {
        if (festivals == null || festivals.isEmpty()) {
            return List.of();
        }

        Festival main = festivals.get(0);
        String area = extractNearbyArea(main.getLocation(), main.getRegion());
        return findNearbyCultureEvents(main, area, 12);
    }

    private List<Festival> findNearbyCultureEvents(Festival main, String nearbyArea, int limit) {
        if (main == null || nearbyArea == null || nearbyArea.isBlank()) {
            return List.of();
        }

        String normalizedArea = normalizeSearchText(nearbyArea);
        String mainRegion = normalizeSearchText(main.getRegion());

        return festivalRepository.findAll().stream()
                .filter(festival -> !festival.getId().equals(main.getId()))
                .filter(festival -> {
                    String target = normalizeSearchText(String.join(" ",
                            nullToBlank(festival.getRegion()),
                            nullToBlank(festival.getLocation())
                    ));
                    return target.contains(normalizedArea)
                            || (!mainRegion.isBlank() && target.contains(mainRegion));
                })
                .sorted((left, right) -> Integer.compare(
                        nearbyCultureScore(right, normalizedArea),
                        nearbyCultureScore(left, normalizedArea)
                ))
                .collect(java.util.stream.Collectors.toMap(
                        this::nearbyFestivalUniqueKey,
                        festival -> festival,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ))
                .values().stream()
                .limit(Math.max(limit, 1))
                .toList();
    }

    private String nearbyFestivalUniqueKey(Festival festival) {
        return recommendationUniqueKey(festival);
    }

    private String recommendationUniqueKey(Festival festival) {
        String title = normalizeRecommendationKeyPart(festival.getTitle());
        String startDate = normalizeRecommendationKeyPart(festival.getStartDate());
        String endDate = normalizeRecommendationKeyPart(festival.getEndDate());

        if (!title.isBlank() && (!startDate.isBlank() || !endDate.isBlank())) {
            return title + "|" + startDate + "|" + endDate;
        }

        return title + "|"
                + normalizeRecommendationKeyPart(festival.getRegion()) + "|"
                + normalizeRecommendationKeyPart(festival.getLocation());
    }

    private String normalizeRecommendationKeyPart(String value) {
        return nullToBlank(value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^0-9a-z가-힣]", "");
    }

    private int nearbyCultureScore(Festival festival, String normalizedArea) {
        int score = 0;
        String target = normalizeSearchText(String.join(" ",
                nullToBlank(festival.getTitle()),
                nullToBlank(festival.getRegion()),
                nullToBlank(festival.getLocation()),
                nullToBlank(festival.getCategory())
        ));

        if (target.contains(normalizedArea)) {
            score += 30;
        }
        if (target.contains("전시") || target.contains("공연") || target.contains("축제") || target.contains("문화")) {
            score += 10;
        }
        if (isOngoingOrUpcoming(festival)) {
            score += 20;
        }

        return score;
    }

    private boolean isOngoingOrUpcoming(Festival festival) {
        try {
            String endDate = festival.getEndDate();
            if (endDate == null || endDate.isBlank()) {
                return true;
            }
            LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.BASIC_ISO_DATE);
            return !end.isBefore(LocalDate.now());
        } catch (Exception e) {
            return true;
        }
    }

    private String normalizeSearchText(String value) {
        return nullToBlank(value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^0-9a-z가-힣]", "");
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }
}
