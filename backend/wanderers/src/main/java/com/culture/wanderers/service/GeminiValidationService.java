package com.culture.wanderers.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.culture.wanderers.dto.GeminiExtractResponse;

@Service
public class GeminiValidationService {

    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final Set<String> ALLOWED_INTENTS = Set.of("recommend_festival", "search_festival");
    private static final Set<String> ALLOWED_COMPANIONS = Set.of("solo", "friend", "couple", "family", "group");

    private static final Map<String, String> REGION_ALIASES = createRegionAliases();

    private static final Set<String> NOISE_KEYWORDS = Set.of(
            "추천", "추천해줘", "추천해줘요", "알려줘", "알려주세요", "있어", "있어?", "어디", "뭐", "좋아",
            "가볼만한", "가볼만한데", "갈만한", "갈만한데", "놀거리", "놀곳", "놀만한곳", "볼거리",
            "참여하는", "참여할", "관련된", "관련", "장소", "곳", "행사", "문화행사", "축제", "전시", "공연", "체험",
            "오늘", "내일", "모레", "무료", "가고", "갈", "보러", "찾아줘", "찾아", "혹시",
            "서울", "서울시", "서울특별시", "부산", "부산시", "부산광역시", "인천", "인천시", "인천광역시",
            "대구", "대구시", "대구광역시", "광주", "광주시", "광주광역시", "대전", "대전시", "대전광역시",
            "울산", "울산시", "울산광역시", "세종", "세종시", "세종특별자치시", "경기", "경기도",
            "강원", "강원도", "강원특별자치도", "충북", "충청북도", "충남", "충청남도",
            "전북", "전북특별자치도", "전라북도", "전남", "전라남도", "경북", "경상북도",
            "경남", "경상남도", "제주", "제주도", "제주특별자치도"
    );

    private static final Set<String> GENERIC_ACTIVITY_WORDS = Set.of(
            "가볼만한", "가볼만한데", "갈만한", "갈만한데", "놀거리", "놀곳", "놀만한곳", "볼거리",
            "참여하는", "참여할", "관련된", "관련", "곳", "장소"
    );

    private static final Pattern YYYYMMDD_DASH_PATTERN = Pattern.compile("(\\d{4})-(\\d{1,2})-(\\d{1,2})");
    private static final Pattern MONTH_DAY_KO_PATTERN = Pattern.compile("(\\d{1,2})\\s*월\\s*(\\d{1,2})\\s*일");
    private static final Pattern MONTH_DAY_SLASH_PATTERN = Pattern.compile("(\\d{1,2})\\s*/\\s*(\\d{1,2})");
    private static final Pattern MONTH_DAY_DASH_PATTERN = Pattern.compile("(\\d{1,2})-(\\d{1,2})");
    private static final Pattern TOKEN_PATTERN = Pattern.compile("[0-9A-Za-z가-힣]+");

    public GeminiExtractResponse validateAndNormalize(GeminiExtractResponse raw, String originalQuery) {
        GeminiExtractResponse safe = new GeminiExtractResponse();

        safe.setIntent(normalizeIntent(raw != null ? raw.getIntent() : null));

        String normalizedRegion = normalizeRegion(firstNonBlank(
                raw != null ? raw.getRegion() : null,
                extractRegionFromText(originalQuery)
        ));
        safe.setRegion(normalizedRegion);

        String normalizedCategory = normalizeCategory(
                firstNonBlank(raw != null ? raw.getCategory() : null, inferCategoryFromText(originalQuery)),
                originalQuery
        );
        safe.setCategory(normalizedCategory);

        safe.setCompanions(normalizeCompanions(firstNonBlank(
                raw != null ? raw.getCompanions() : null,
                extractCompanionFromText(originalQuery)
        )));
        safe.setDate(normalizeDate(firstNonBlank(
                raw != null ? raw.getDate() : null,
                extractDateFromText(originalQuery)
        )));
        safe.setPriceMax(inferPriceMax(raw != null ? raw.getPriceMax() : null, originalQuery));
        safe.setKeywords(normalizeKeywords(
                raw != null ? raw.getKeywords() : null,
                originalQuery,
                safe.getRegion(),
                safe.getCategory(),
                safe.getCompanions(),
                safe.getDate()
        ));

        return safe;
    }

    private String normalizeIntent(String value) {
        String normalized = normalizeBlank(value);
        if (normalized == null) {
            return "recommend_festival";
        }
        return ALLOWED_INTENTS.contains(normalized) ? normalized : "recommend_festival";
    }

    private String normalizeRegion(String value) {
        String normalized = normalizeBlank(value);
        if (normalized == null) {
            return null;
        }

        for (Map.Entry<String, String> entry : REGION_ALIASES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return normalized;
    }

    private String normalizeCategory(String value, String originalQuery) {
        String normalized = normalizeBlank(value);
        if (normalized == null) {
            return null;
        }

        String query = normalizeBlank(originalQuery);
        if (query != null && containsGenericActivityIntent(query) && !containsExplicitCategoryWord(query)) {
            return null;
        }

        String lower = normalized.toLowerCase();
        if (lower.contains("festival") || normalized.contains("축제") || normalized.contains("페스티벌")) {
            return "축제";
        }
        if (lower.contains("performance") || normalized.contains("공연")) {
            return "공연";
        }
        if (lower.contains("exhibition") || normalized.contains("전시")
                || normalized.contains("미술관") || normalized.contains("박물관")) {
            return "전시";
        }
        if (lower.contains("experience") || normalized.contains("체험")) {
            return "체험";
        }
        return null;
    }

    private String inferCategoryFromText(String text) {
        String normalized = normalizeBlank(text);
        if (normalized == null) {
            return null;
        }

        if (normalized.contains("미술관") || normalized.contains("박물관") || normalized.contains("전시")) {
            return "전시";
        }
        if (normalized.contains("공연")) {
            return "공연";
        }
        if (normalized.contains("체험")) {
            return "체험";
        }
        if (normalized.contains("축제") || normalized.contains("페스티벌")) {
            return "축제";
        }
        return null;
    }

    private String normalizeCompanions(String value) {
        String normalized = normalizeBlank(value);
        if (normalized == null) {
            return null;
        }

        String lower = normalized.toLowerCase();
        if (lower.contains("solo") || lower.contains("alone") || normalized.contains("혼자")) return "solo";
        if (lower.contains("friend") || normalized.contains("친구")) return "friend";
        if (lower.contains("couple") || normalized.contains("커플") || normalized.contains("연인")
                || normalized.contains("데이트")) return "couple";
        if (lower.contains("family") || normalized.contains("가족")) return "family";
        if (lower.contains("group") || normalized.contains("단체")) return "group";
        return ALLOWED_COMPANIONS.contains(lower) ? lower : null;
    }

    private String extractCompanionFromText(String text) {
        return normalizeCompanions(text);
    }

    private String normalizeDate(String value) {
        String normalized = normalizeBlank(value);
        if (normalized == null) {
            return null;
        }

        if (normalized.matches("\\d{8}")) {
            return normalized;
        }

        Matcher ymdDashMatcher = YYYYMMDD_DASH_PATTERN.matcher(normalized);
        if (ymdDashMatcher.find()) {
            return formatDate(
                    Integer.parseInt(ymdDashMatcher.group(1)),
                    Integer.parseInt(ymdDashMatcher.group(2)),
                    Integer.parseInt(ymdDashMatcher.group(3))
            );
        }

        Matcher monthDayKoMatcher = MONTH_DAY_KO_PATTERN.matcher(normalized);
        if (monthDayKoMatcher.find()) {
            return formatDate(
                    LocalDate.now().getYear(),
                    Integer.parseInt(monthDayKoMatcher.group(1)),
                    Integer.parseInt(monthDayKoMatcher.group(2))
            );
        }

        Matcher monthDaySlashMatcher = MONTH_DAY_SLASH_PATTERN.matcher(normalized);
        if (monthDaySlashMatcher.find()) {
            return formatDate(
                    LocalDate.now().getYear(),
                    Integer.parseInt(monthDaySlashMatcher.group(1)),
                    Integer.parseInt(monthDaySlashMatcher.group(2))
            );
        }

        Matcher monthDayDashMatcher = MONTH_DAY_DASH_PATTERN.matcher(normalized);
        if (monthDayDashMatcher.find()) {
            return formatDate(
                    LocalDate.now().getYear(),
                    Integer.parseInt(monthDayDashMatcher.group(1)),
                    Integer.parseInt(monthDayDashMatcher.group(2))
            );
        }

        return null;
    }

    private String extractDateFromText(String text) {
        String normalized = normalizeBlank(text);
        if (normalized == null) {
            return null;
        }

        if (normalized.contains("오늘")) return LocalDate.now().format(BASIC_DATE);
        if (normalized.contains("내일")) return LocalDate.now().plusDays(1).format(BASIC_DATE);
        if (normalized.contains("모레")) return LocalDate.now().plusDays(2).format(BASIC_DATE);
        return normalizeDate(normalized);
    }

    private String extractRegionFromText(String text) {
        String normalized = normalizeBlank(text);
        if (normalized == null) {
            return null;
        }

        for (Map.Entry<String, String> entry : REGION_ALIASES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return null;
    }

    private Integer inferPriceMax(Integer rawPriceMax, String text) {
        if (text != null && text.contains("무료")) {
            return 0;
        }
        return rawPriceMax != null && rawPriceMax >= 0 ? rawPriceMax : null;
    }

    private List<String> normalizeKeywords(
            List<String> rawKeywords,
            String originalQuery,
            String region,
            String category,
            String companions,
            String date
    ) {
        List<String> sources = new ArrayList<>();
        if (rawKeywords != null) {
            sources.addAll(rawKeywords);
        }
        if (originalQuery != null && !originalQuery.isBlank()) {
            sources.add(originalQuery);
        }

        LinkedHashSet<String> result = new LinkedHashSet<>();

        for (String source : sources) {
            String cleaned = normalizeBlank(source);
            if (cleaned == null) {
                continue;
            }

            cleaned = cleaned
                    .replaceAll("\\d{4}-\\d{1,2}-\\d{1,2}", " ")
                    .replaceAll("\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일", " ")
                    .replaceAll("\\d{1,2}\\s*/\\s*\\d{1,2}", " ")
                    .replaceAll("\\d{1,2}-\\d{1,2}", " ")
                    .replace("무료", " ")
                    .replace("오늘", " ")
                    .replace("내일", " ")
                    .replace("모레", " ");

            if (region != null) cleaned = cleaned.replace(region, " ");
            if (category != null) cleaned = cleaned.replace(category, " ");
            if (date != null) cleaned = cleaned.replace(date, " ");
            if (companions != null) cleaned = cleaned.replace(companions, " ");

            for (String alias : REGION_ALIASES.keySet()) {
                cleaned = cleaned.replace(alias, " ");
            }

            Matcher matcher = TOKEN_PATTERN.matcher(cleaned);
            while (matcher.find()) {
                String token = normalizeBlank(matcher.group());
                if (token == null) {
                    continue;
                }
                if (NOISE_KEYWORDS.contains(token)) {
                    continue;
                }
                result.add(token);
            }
        }

        return result.stream().limit(10).toList();
    }

    private boolean containsGenericActivityIntent(String query) {
        return GENERIC_ACTIVITY_WORDS.stream().anyMatch(query::contains);
    }

    private boolean containsExplicitCategoryWord(String query) {
        return query.contains("축제")
                || query.contains("페스티벌")
                || query.contains("전시")
                || query.contains("미술관")
                || query.contains("박물관")
                || query.contains("공연")
                || query.contains("체험")
                || query.contains("음식")
                || query.contains("먹거리")
                || query.contains("도자기")
                || query.contains("드론")
                || query.contains("꽃");
    }

    private String formatDate(int year, int month, int day) {
        try {
            return LocalDate.of(year, month, day).format(BASIC_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed) ? null : trimmed;
    }

    private String firstNonBlank(String first, String second) {
        return normalizeBlank(first) != null ? first : second;
    }

    private static Map<String, String> createRegionAliases() {
        Map<String, String> aliases = new LinkedHashMap<>();
        aliases.put("서울특별시", "서울");
        aliases.put("서울시", "서울");
        aliases.put("서울", "서울");
        aliases.put("부산광역시", "부산");
        aliases.put("부산시", "부산");
        aliases.put("부산", "부산");
        aliases.put("인천광역시", "인천");
        aliases.put("인천시", "인천");
        aliases.put("인천", "인천");
        aliases.put("대구광역시", "대구");
        aliases.put("대구시", "대구");
        aliases.put("대구", "대구");
        aliases.put("광주광역시", "광주");
        aliases.put("광주시", "광주");
        aliases.put("광주", "광주");
        aliases.put("대전광역시", "대전");
        aliases.put("대전시", "대전");
        aliases.put("대전", "대전");
        aliases.put("울산광역시", "울산");
        aliases.put("울산시", "울산");
        aliases.put("울산", "울산");
        aliases.put("세종특별자치시", "세종");
        aliases.put("세종시", "세종");
        aliases.put("세종", "세종");
        aliases.put("경기도", "경기");
        aliases.put("경기", "경기");
        aliases.put("강원특별자치도", "강원");
        aliases.put("강원도", "강원");
        aliases.put("강원", "강원");
        aliases.put("충청북도", "충북");
        aliases.put("충북", "충북");
        aliases.put("충청남도", "충남");
        aliases.put("충남", "충남");
        aliases.put("전북특별자치도", "전북");
        aliases.put("전라북도", "전북");
        aliases.put("전북", "전북");
        aliases.put("전라남도", "전남");
        aliases.put("전남", "전남");
        aliases.put("경상북도", "경북");
        aliases.put("경북", "경북");
        aliases.put("경상남도", "경남");
        aliases.put("경남", "경남");
        aliases.put("제주특별자치도", "제주");
        aliases.put("제주도", "제주");
        aliases.put("제주", "제주");
        return aliases;
    }
}
