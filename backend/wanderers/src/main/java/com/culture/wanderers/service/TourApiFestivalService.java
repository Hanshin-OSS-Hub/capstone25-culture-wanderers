package com.culture.wanderers.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.culture.wanderers.dto.GeminiExtractResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.FestivalRepository;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class TourApiFestivalService {

    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final Map<String, String> AREA_CODES = createAreaCodes();
    private static final Map<String, String> GYEONGGI_SIGUNGU_CODES = createGyeonggiSigunguCodes();
    private static final String SOURCE = "TOUR_API";

    private final ExternalFestivalUpsertService upsertService;
    private final RestTemplate restTemplate;
    private final String serviceKey;
    private final boolean enabled;

    public TourApiFestivalService(
            ExternalFestivalUpsertService upsertService,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${tourapi.service-key:}") String serviceKey,
            @Value("${tourapi.enabled:true}") boolean enabled
    ) {
        this.upsertService = upsertService;
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(4))
                .readTimeout(Duration.ofSeconds(6))
                .build();
        this.serviceKey = serviceKey;
        this.enabled = enabled;
    }

    public List<Festival> fetchAndSave(GeminiExtractResponse condition, String query, int limit) {
        if (!enabled || serviceKey == null || serviceKey.isBlank()) {
            return List.of();
        }

        try {
            List<Festival> fetched = fetchFestivalList(condition, limit);
            if (fetched.isEmpty()) {
                return List.of();
            }

            return fetched.stream()
                    .filter(festival -> matchesQueryHints(festival, condition, query))
                    .map(upsertService::upsert)
                    .flatMap(Optional::stream)
                    .limit(Math.max(limit, 1))
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    public int syncUpcoming(int limit) {
        if (!enabled || serviceKey == null || serviceKey.isBlank()) {
            return 0;
        }

        GeminiExtractResponse condition = new GeminiExtractResponse();
        condition.setDate(LocalDate.now().format(BASIC_DATE));
        return fetchFestivalList(condition, Math.max(limit, 1)).stream()
                .map(upsertService::upsert)
                .mapToInt(saved -> saved.isPresent() ? 1 : 0)
                .sum();
    }

    private List<Festival> fetchFestivalList(GeminiExtractResponse condition, int limit) {
        String eventStartDate = resolveSearchDate(condition);
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString("https://apis.data.go.kr/B551011/KorService2/searchFestival2")
                .queryParam("serviceKey", serviceKey)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "CultureWanderers")
                .queryParam("_type", "json")
                .queryParam("arrange", "R")
                .queryParam("numOfRows", Math.min(Math.max(limit * 3, 10), 60))
                .queryParam("pageNo", 1)
                .queryParam("eventStartDate", eventStartDate);

        String areaCode = resolveAreaCode(condition != null ? condition.getRegion() : null);
        if (areaCode != null) {
            builder.queryParam("areaCode", areaCode);
        }

        String sigunguCode = resolveSigunguCode(condition != null ? condition.getRegion() : null, areaCode);
        if (sigunguCode != null) {
            builder.queryParam("sigunguCode", sigunguCode);
        }

        ResponseEntity<JsonNode> response = restTemplate.getForEntity(builder.build(true).toUri(), JsonNode.class);
        JsonNode items = response.getBody()
                .path("response")
                .path("body")
                .path("items")
                .path("item");

        if (items.isMissingNode() || items.isNull()) {
            return List.of();
        }

        List<Festival> festivals = new ArrayList<>();
        if (items.isArray()) {
            for (JsonNode item : items) {
                toFestival(item).ifPresent(festivals::add);
            }
        } else {
            toFestival(items).ifPresent(festivals::add);
        }

        return festivals;
    }

    private Optional<Festival> toFestival(JsonNode item) {
        String title = cleanText(text(item, "title"));
        String startDate = text(item, "eventstartdate");
        if (title.isBlank() || startDate.isBlank()) {
            return Optional.empty();
        }

        String location = cleanText(text(item, "addr1"));
        Festival festival = new Festival();
        festival.setSource(SOURCE);
        festival.setExternalId(text(item, "contentid"));
        festival.setTitle(title);
        festival.setRegion(extractRegion(location));
        festival.setLocation(location.isBlank() ? "장소 정보 없음" : location);
        festival.setStartDate(startDate);
        festival.setEndDate(defaultIfBlank(text(item, "eventenddate"), startDate));
        festival.setThumbnailUrl(firstNonBlank(text(item, "firstimage"), text(item, "firstimage2")));
        festival.setCategory("축제");
        festival.setPrice("정보 없음");
        festival.setDescription(cleanText(firstNonBlank(text(item, "overview"), "대한민국 구석구석 TourAPI에서 가져온 문화행사 정보입니다.")));
        festival.setTel(cleanText(text(item, "tel")));
        festival.setHomepageUrl(defaultIfBlank(text(item, "cpyrhtDivCd"), "https://korean.visitkorea.or.kr/main/theme.do"));
        return Optional.of(festival);
    }

    private boolean matchesQueryHints(Festival festival, GeminiExtractResponse condition, String query) {
        if (condition != null && hasText(condition.getRegion())
                && !containsIgnoreCase(festival.getRegion(), condition.getRegion())
                && !containsIgnoreCase(festival.getLocation(), condition.getRegion())) {
            return false;
        }

        if (condition != null && Integer.valueOf(0).equals(condition.getPriceMax())) {
            String haystack = normalize(festival.getPrice() + " " + festival.getDescription() + " " + query);
            if (!haystack.contains("무료") && !haystack.contains("0원") && !haystack.contains("free")) {
                return false;
            }
        }

        return true;
    }

    private String resolveSearchDate(GeminiExtractResponse condition) {
        if (condition != null && hasText(condition.getDate())) {
            return condition.getDate();
        }
        return LocalDate.now().format(BASIC_DATE);
    }

    private String resolveAreaCode(String region) {
        if (!hasText(region)) {
            return null;
        }

        String normalized = normalize(region);
        if (normalized.contains("남양주") || normalized.contains("양주")) {
            return "31";
        }

        for (Map.Entry<String, String> entry : AREA_CODES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String resolveSigunguCode(String region, String areaCode) {
        if (!"31".equals(areaCode) || !hasText(region)) {
            return null;
        }

        String normalized = normalize(region);
        for (Map.Entry<String, String> entry : GYEONGGI_SIGUNGU_CODES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String extractRegion(String location) {
        if (!hasText(location)) {
            return "기타";
        }
        String[] parts = location.trim().split("\\s+");
        return parts.length == 0 ? "기타" : parts[0];
    }

    private String cleanText(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("<[^>]+>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isMissingNode() || value.isNull() ? "" : value.asText("");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return "";
    }

    private String defaultIfBlank(String value, String fallback) {
        return hasText(value) ? value : fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean containsIgnoreCase(String target, String keyword) {
        return normalize(target).contains(normalize(keyword));
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private static Map<String, String> createAreaCodes() {
        Map<String, String> codes = new LinkedHashMap<>();
        codes.put("서울", "1");
        codes.put("인천", "2");
        codes.put("대전", "3");
        codes.put("대구", "4");
        codes.put("광주", "5");
        codes.put("부산", "6");
        codes.put("울산", "7");
        codes.put("세종", "8");
        codes.put("남양주", "31");
        codes.put("양주", "31");
        codes.put("경기", "31");
        codes.put("강원", "32");
        codes.put("충북", "33");
        codes.put("충청북", "33");
        codes.put("충남", "34");
        codes.put("충청남", "34");
        codes.put("경북", "35");
        codes.put("경상북", "35");
        codes.put("경남", "36");
        codes.put("경상남", "36");
        codes.put("전북", "37");
        codes.put("전라북", "37");
        codes.put("전남", "38");
        codes.put("전라남", "38");
        codes.put("제주", "39");
        return codes;
    }

    private static Map<String, String> createGyeonggiSigunguCodes() {
        Map<String, String> codes = new LinkedHashMap<>();
        codes.put("남양주", "9");
        codes.put("양주", "18");
        return codes;
    }
}
