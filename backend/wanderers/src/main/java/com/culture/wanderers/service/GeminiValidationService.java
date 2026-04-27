package com.culture.wanderers.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.culture.wanderers.dto.GeminiExtractResponse;

@Service
public class GeminiValidationService {

    private static final Set<String> ALLOWED_INTENTS = Set.of(
            "recommend_festival",
            "search_festival"
    );

    private static final Set<String> ALLOWED_COMPANIONS = Set.of(
            "solo", "friend", "couple", "family", "group"
    );

    private static final Set<String> NOISE_KEYWORDS = Set.of(
            "에", "에서", "으로", "로", "좀", "추천", "추천해줘", "있어", "있어?",
            "갈만한", "갈만한데", "갈", "가고", "가고싶어", "가고싶은", "놀고",
            "놀고싶어", "놀고싶은", "놀고싶은데", "좋은", "곳", "데", "뭐", "어디",
            "친구랑", "같이", "함께", "행사", "축제", "전시", "공연", "체험"
    );

    private static final Pattern MONTH_DAY_KO_PATTERN = Pattern.compile("(\\d{1,2})\\s*월\\s*(\\d{1,2})\\s*일");
    private static final Pattern MONTH_DAY_SLASH_PATTERN = Pattern.compile("(\\d{1,2})\\s*/\\s*(\\d{1,2})");
    private static final Pattern YYYYMMDD_DASH_PATTERN = Pattern.compile("(\\d{4})-(\\d{1,2})-(\\d{1,2})");
    private static final Pattern MONTH_DAY_DASH_PATTERN = Pattern.compile("(\\d{1,2})-(\\d{1,2})");

    public GeminiExtractResponse validateAndNormalize(GeminiExtractResponse raw, String originalQuery) {
        GeminiExtractResponse safe = new GeminiExtractResponse();

        if (raw == null) {
            safe.setIntent("recommend_festival");
            safe.setRegion(extractRegionFromText(originalQuery));
            safe.setCategory(inferCategoryFromText(originalQuery));
            safe.setCompanions(extractCompanionFromText(originalQuery));
            safe.setDate(extractDateFromText(originalQuery));
            safe.setKeywords(new ArrayList<>());
            return safe;
        }

        safe.setIntent(
                ALLOWED_INTENTS.contains(nullToEmpty(raw.getIntent()))
                ? raw.getIntent()
                : "recommend_festival"
        );

        String normalizedRegion = normalizeBlank(raw.getRegion());
        if (normalizedRegion == null) {
            normalizedRegion = extractRegionFromText(originalQuery);
        }

        String normalizedCompanions = normalizeCompanions(raw.getCompanions());
        if (normalizedCompanions == null) {
            normalizedCompanions = extractCompanionFromText(originalQuery);
        }

        String normalizedCategory = normalizeCategory(raw.getCategory());
        if (normalizedCategory == null) {
            normalizedCategory = inferCategoryFromText(originalQuery);
        }

        String normalizedDate = normalizeDate(raw.getDate());
        if (normalizedDate == null) {
            normalizedDate = extractDateFromText(originalQuery);
        }

        // 4/27 사용자가 날짜를 입력하지 않으면 날짜 조건을 적용하지 않음
        safe.setRegion(normalizedRegion);
        safe.setCategory(normalizedCategory);
        safe.setCompanions(normalizedCompanions);
        safe.setDate(normalizedDate);
        // 4/27 무료 키워드가 있으면 무료 조건으로 처리
        if (originalQuery != null && originalQuery.contains("무료")) {
            safe.setPriceMax(0);
        } else {
            safe.setPriceMax(raw.getPriceMax() != null && raw.getPriceMax() >= 0 ? raw.getPriceMax() : null);
        }

        List<String> keywords = normalizeKeywords(
                raw.getKeywords(),
                originalQuery,
                normalizedRegion,
                normalizedCategory,
                normalizedCompanions,
                normalizedDate
        );

        safe.setKeywords(keywords);

        return safe;
    }

    private String normalizeCategory(String value) {
        String v = normalizeBlank(value);
        if (v == null) {
            return null;
        }

        if (v.equalsIgnoreCase("festival") || v.equals("축제")) {
            return "축제";
        }
        if (v.equalsIgnoreCase("performance") || v.equals("공연")) {
            return "공연";
        }
        if (v.equalsIgnoreCase("exhibition") || v.equals("전시")) {
            return "전시";
        }
        if (v.equalsIgnoreCase("experience") || v.equals("체험")) {
            return "체험";
        }
        if (v.equals("행사")) {
            return null;
        }

        return null;
    }

    private String inferCategoryFromText(String text) {
        String v = normalizeBlank(text);
        if (v == null) {
            return null;
        }

        if (v.contains("전시")) {
            return "전시";
        }
        if (v.contains("공연")) {
            return "공연";
        }
        if (v.contains("체험")) {
            return "체험";
        }
        if (v.contains("축제")) {
            return "축제";
        }

        return null;
    }

    private String normalizeCompanions(String value) {
        String v = normalizeBlank(value);
        if (v == null) {
            return null;
        }

        String lower = v.toLowerCase();

        if (lower.equals("혼자") || lower.equals("solo") || lower.equals("alone")) {
            return "solo";
        }
        if (lower.equals("친구") || lower.equals("friend")) {
            return "friend";
        }
        if (lower.equals("연인") || lower.equals("커플") || lower.equals("데이트") || lower.equals("couple")) {
            return "couple";
        }
        if (lower.equals("가족") || lower.equals("family")) {
            return "family";
        }
        if (lower.equals("단체") || lower.equals("group")) {
            return "group";
        }

        return ALLOWED_COMPANIONS.contains(lower) ? lower : null;
    }

    private String extractCompanionFromText(String text) {
        String v = normalizeBlank(text);
        if (v == null) {
            return null;
        }

        if (v.contains("혼자")) {
            return "solo";
        }
        if (v.contains("친구")) {
            return "friend";
        }
        if (v.contains("연인") || v.contains("커플") || v.contains("데이트")) {
            return "couple";
        }
        if (v.contains("가족")) {
            return "family";
        }
        if (v.contains("단체")) {
            return "group";
        }

        return null;
    }

    private String normalizeDate(String value) {
        String v = normalizeBlank(value);
        if (v == null) {
            return null;
        }

        String digits = v.replaceAll("[^0-9]", "");
        if (digits.length() == 8) {
            return digits;
        }

        Matcher ymdDashMatcher = YYYYMMDD_DASH_PATTERN.matcher(v);
        if (ymdDashMatcher.find()) {
            int year = Integer.parseInt(ymdDashMatcher.group(1));
            int month = Integer.parseInt(ymdDashMatcher.group(2));
            int day = Integer.parseInt(ymdDashMatcher.group(3));
            return formatDate(year, month, day);
        }

        Matcher monthDayKoMatcher = MONTH_DAY_KO_PATTERN.matcher(v);
        if (monthDayKoMatcher.find()) {
            int year = LocalDate.now().getYear();
            int month = Integer.parseInt(monthDayKoMatcher.group(1));
            int day = Integer.parseInt(monthDayKoMatcher.group(2));
            return formatDate(year, month, day);
        }

        Matcher monthDaySlashMatcher = MONTH_DAY_SLASH_PATTERN.matcher(v);
        if (monthDaySlashMatcher.find()) {
            int year = LocalDate.now().getYear();
            int month = Integer.parseInt(monthDaySlashMatcher.group(1));
            int day = Integer.parseInt(monthDaySlashMatcher.group(2));
            return formatDate(year, month, day);
        }

        Matcher monthDayDashMatcher = MONTH_DAY_DASH_PATTERN.matcher(v);
        if (monthDayDashMatcher.find()) {
            int year = LocalDate.now().getYear();
            int month = Integer.parseInt(monthDayDashMatcher.group(1));
            int day = Integer.parseInt(monthDayDashMatcher.group(2));
            return formatDate(year, month, day);
        }

        if (digits.length() == 3 || digits.length() == 4) {
            int year = LocalDate.now().getYear();
            int month;
            int day;

            if (digits.length() == 3) {
                month = Integer.parseInt(digits.substring(0, 1));
                day = Integer.parseInt(digits.substring(1));
            } else {
                month = Integer.parseInt(digits.substring(0, 2));
                day = Integer.parseInt(digits.substring(2));
            }

            return formatDate(year, month, day);
        }

        return null;
    }

    private String extractDateFromText(String text) {
        String v = normalizeBlank(text);
        if (v == null) {
            return null;
        }

        // 4/27 오늘/내일/모레 자연어 날짜 처리
        if (v.contains("오늘")) {
            return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }

        if (v.contains("내일")) {
            return LocalDate.now().plusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }

        if (v.contains("모레")) {
            return LocalDate.now().plusDays(2).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }

        Matcher monthDayKoMatcher = MONTH_DAY_KO_PATTERN.matcher(v);
        if (monthDayKoMatcher.find()) {
            int year = LocalDate.now().getYear();
            int month = Integer.parseInt(monthDayKoMatcher.group(1));
            int day = Integer.parseInt(monthDayKoMatcher.group(2));
            return formatDate(year, month, day);
        }

        Matcher monthDaySlashMatcher = MONTH_DAY_SLASH_PATTERN.matcher(v);
        if (monthDaySlashMatcher.find()) {
            int year = LocalDate.now().getYear();
            int month = Integer.parseInt(monthDaySlashMatcher.group(1));
            int day = Integer.parseInt(monthDaySlashMatcher.group(2));
            return formatDate(year, month, day);
        }

        Matcher monthDayDashMatcher = MONTH_DAY_DASH_PATTERN.matcher(v);
        if (monthDayDashMatcher.find()) {
            int year = LocalDate.now().getYear();
            int month = Integer.parseInt(monthDayDashMatcher.group(1));
            int day = Integer.parseInt(monthDayDashMatcher.group(2));
            return formatDate(year, month, day);
        }

        return null;
    }

    private String extractRegionFromText(String text) {
        String v = normalizeBlank(text);
        if (v == null) {
            return null;
        }

        if (v.contains("서울")) {
            return "서울";
        }
        if (v.contains("부산")) {
            return "부산";
        }
        if (v.contains("인천")) {
            return "인천";
        }
        if (v.contains("대구")) {
            return "대구";
        }
        if (v.contains("광주")) {
            return "광주";
        }
        if (v.contains("대전")) {
            return "대전";
        }
        if (v.contains("울산")) {
            return "울산";
        }
        if (v.contains("경기")) {
            return "경기";
        }
        if (v.contains("강원")) {
            return "강원";
        }
        if (v.contains("충북")) {
            return "충북";
        }
        if (v.contains("충남")) {
            return "충남";
        }
        if (v.contains("전북")) {
            return "전북";
        }
        if (v.contains("전남")) {
            return "전남";
        }
        if (v.contains("경북")) {
            return "경북";
        }
        if (v.contains("경남")) {
            return "경남";
        }
        if (v.contains("제주")) {
            return "제주";
        }

        return null;
    }

    private List<String> normalizeKeywords(
            List<String> rawKeywords,
            String originalQuery,
            String region,
            String category,
            String companions,
            String date
    ) {
        List<String> source = new ArrayList<>();

        if (rawKeywords != null) {
            source.addAll(rawKeywords);
        }

        // 4/27 Gemini가 핵심 키워드를 빠뜨려도 원문에서 다시 키워드 추출
        if (originalQuery != null && !originalQuery.isBlank()) {
            source.add(originalQuery);
        }

        List<String> result = new ArrayList<>();

        for (String keyword : source) {
            String normalized = normalizeBlank(keyword);
            if (normalized == null) {
                continue;
            }

            String cleaned = normalized
                    .replaceAll("\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일", " ")
                    .replaceAll("\\d{1,2}\\s*/\\s*\\d{1,2}", " ")
                    .replaceAll("\\d{1,2}-\\d{1,2}", " ")
                    .replaceAll("\\d{4}-\\d{1,2}-\\d{1,2}", " ")
                    .replace("축제", " ")
                    .replace("행사", " ")
                    .replace("전시", " ")
                    .replace("공연", " ")
                    .replace("체험", " ")
                    .replace("친구", " ")
                    .replace("친구랑", " ")
                    .replace("혼자", " ")
                    .replace("가족", " ")
                    .replace("연인", " ")
                    .replace("커플", " ")
                    .replace("데이트", " ")
                    .replace("무료", " ")
                    .replace("오늘", " ")
                    .replace("내일", " ")
                    .replace("모레", " ")
                    .replace("추천해줘", " ")
                    .replace("추천", " ")
                    .replace("갈만한데", " ")
                    .replace("갈만한", " ")
                    .replace("갈 곳", " ")
                    .replace("갈곳", " ")
                    .replace("놀고싶은데", " ")
                    .replace("놀고 싶은데", " ")
                    .replace("놀고싶어", " ")
                    .replace("놀고 싶어", " ")
                    .replace("같이", " ")
                    .replace("함께", " ")
                    .replace("가고싶어", " ")
                    .replace("가고 싶어", " ")
                    .replace("있어?", " ")
                    .replace("있어", " ")
                    .replace("어디", " ")
                    .replace("뭐", " ")
                    .trim();

            if (region != null) {
                cleaned = cleaned.replace(region, " ").trim();
            }

            if (category != null) {
                cleaned = cleaned.replace(category, " ").trim();
            }

            if (date != null) {
                cleaned = cleaned.replace(date, " ").trim();
            }

            if (companions != null) {
                cleaned = cleaned.replace(companions, " ").trim();
            }

            cleaned = cleaned.replaceAll("\\s+", " ").trim();

            if (cleaned.isBlank()) {
                continue;
            }

            String[] parts = cleaned.split(" ");
            for (String part : parts) {
                String token = normalizeBlank(part);
                if (token == null) {
                    continue;
                }

                // 4/27 한글 1글자 키워드도 검색에 사용
                if (token.length() <= 1 && !token.matches("[가-힣]")) {
                    continue;
                }

                if (NOISE_KEYWORDS.contains(token)) {
                    continue;
                }

                if (!result.contains(token)) {
                    result.add(token);
                }
            }
        }

        return result.stream()
                .limit(10)
                .toList();
    }

    private String formatDate(int year, int month, int day) {
        try {
            LocalDate date = LocalDate.of(year, month, day);
            return String.format("%04d%02d%02d", date.getYear(), date.getMonthValue(), date.getDayOfMonth());
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() || trimmed.equalsIgnoreCase("null") ? null : trimmed;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
