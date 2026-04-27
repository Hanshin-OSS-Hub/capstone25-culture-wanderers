package com.culture.wanderers.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.culture.wanderers.dto.GeminiExtractResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.FestivalRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class FestivalSearchService {

    private final FestivalRepository festivalRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final Set<String> NOISE_KEYWORDS = Set.of(
            "추천", "추천해줘", "행사", "축제", "전시", "공연", "체험",
            "갈만한", "갈만한데", "있어", "있어?", "어디", "뭐", "좋은", "곳",
            "놀거리", "데이트", "나들이", "가볼만한", "가볼만한곳",
            "무료", "오늘", "내일", "모레",
            "서울", "부산", "인천", "대구", "광주", "대전", "울산",
            "경기", "경기도", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
    );

    public FestivalSearchService(FestivalRepository festivalRepository) {
        this.festivalRepository = festivalRepository;
    }

    public List<Festival> searchByExtractedConditions(GeminiExtractResponse condition) {
        List<String> validKeywords = normalizeSearchKeywords(condition != null ? condition.getKeywords() : null);

        System.out.println("[FestivalSearchService] 검색 조건 region = " + (condition != null ? condition.getRegion() : null));
        System.out.println("[FestivalSearchService] 검색 조건 category = " + (condition != null ? condition.getCategory() : null));
        System.out.println("[FestivalSearchService] 검색 조건 date = " + (condition != null ? condition.getDate() : null));
        System.out.println("[FestivalSearchService] 검색 조건 keywords = " + validKeywords);

        // 4/27 사용자가 날짜를 입력하지 않으면 날짜 조건을 적용하지 않음
        // 4/27 1차: 날짜 + 지역 + 카테고리 + 키워드 검색
        List<Festival> results = festivalRepository.findAll(buildSpecification(condition, validKeywords, true));

        // 4/27 키워드가 있는 검색은 키워드를 제거하지 않음
        if (results.isEmpty() && condition != null && validKeywords.isEmpty()) {
            results = festivalRepository.findAll(buildSpecification(condition, validKeywords, false));
        }

        // 4/27 카테고리만 완화, 키워드는 유지
        if (results.isEmpty() && condition != null) {
            condition.setCategory(null);
            results = festivalRepository.findAll(buildSpecification(condition, validKeywords, true));
        }

        // 4/27 지역만 완화, 키워드는 유지
        if (results.isEmpty() && condition != null && validKeywords.isEmpty()) {
            condition.setRegion(null);
            results = festivalRepository.findAll(buildSpecification(condition, validKeywords, false));
        }

        LocalDate today = LocalDate.now();

        results.sort((a, b) -> {
            int priceCompare = Integer.compare(getPriceScore(a.getPrice()), getPriceScore(b.getPrice()));
            if (priceCompare != 0) {
                return priceCompare;
            }

            long dateDistanceA = getDateDistanceScore(a, today);
            long dateDistanceB = getDateDistanceScore(b, today);
            int distanceCompare = Long.compare(dateDistanceA, dateDistanceB);
            if (distanceCompare != 0) {
                return distanceCompare;
            }

            String startDateA = safeDateString(a.getStartDate());
            String startDateB = safeDateString(b.getStartDate());
            return startDateA.compareTo(startDateB);
        });

        List<Festival> topResults = results.stream()
                .limit(5)
                .toList();

        System.out.println("[FestivalSearchService] 최종 반환 개수 = " + topResults.size());

        return topResults;
    }

    private Specification<Festival> buildSpecification(
            GeminiExtractResponse condition,
            List<String> validKeywords,
            boolean includeKeywords
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 4/27 종료된 행사는 추천 결과에서 제외
            String today = LocalDate.now().format(DATE_FORMATTER);
            predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), today));

            if (condition != null) {
                if (hasText(condition.getRegion())) {
                    predicates.add(
                            cb.like(
                                    cb.lower(root.get("region")),
                                    "%" + condition.getRegion().trim().toLowerCase() + "%"
                            )
                    );
                }

                if (hasText(condition.getCategory())) {
                    predicates.add(
                            cb.like(
                                    cb.lower(root.get("category")),
                                    "%" + condition.getCategory().trim().toLowerCase() + "%"
                            )
                    );
                }

                if (hasText(condition.getDate())) {
                    String date = condition.getDate().trim();

                    // 4/27 입력 날짜 기준 진행 중이거나 이후 7일 내 시작하는 행사까지 추천
                    LocalDate target = LocalDate.parse(date, DATE_FORMATTER);
                    String endRange = target.plusDays(7).format(DATE_FORMATTER);

                    predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), endRange));
                    predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), date));
                }

                // 4/27 무료 조건 검색
                if (condition.getPriceMax() != null && condition.getPriceMax() == 0) {
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("price")), "%무료%"),
                            cb.like(cb.lower(root.get("price")), "%입장료 없음%"),
                            cb.like(cb.lower(root.get("price")), "%없음%"),
                            cb.like(cb.lower(root.get("price")), "%0원%")
                    ));
                }
                if (includeKeywords && validKeywords != null && !validKeywords.isEmpty()) {
                    List<Predicate> keywordGroup = new ArrayList<>();

                    for (String keyword : validKeywords) {
                        String likeKeyword = "%" + keyword.toLowerCase() + "%";

                        // 4/27 챗봇 추천 키워드 검색 범위 축소
                        keywordGroup.add(cb.like(cb.lower(root.get("title")), likeKeyword));
                        keywordGroup.add(cb.like(cb.lower(root.get("location")), likeKeyword));
                        keywordGroup.add(cb.like(cb.lower(root.get("region")), likeKeyword));
                    }

                    if (!keywordGroup.isEmpty()) {
                        predicates.add(cb.or(keywordGroup.toArray(new Predicate[0])));
                    }
                }
            }

            query.orderBy(cb.asc(root.get("startDate")));

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private List<String> normalizeSearchKeywords(List<String> keywords) {
        List<String> result = new ArrayList<>();

        if (keywords == null) {
            return result;
        }

        for (String keyword : keywords) {
            if (!hasText(keyword)) {
                continue;
            }

            String cleaned = keyword.toLowerCase()
                    .replaceAll("\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일", " ")
                    .replaceAll("\\d{1,2}\\s*/\\s*\\d{1,2}", " ")
                    .replaceAll("\\d{1,2}-\\d{1,2}", " ")
                    .replaceAll("\\d{4}-\\d{1,2}-\\d{1,2}", " ")
                    .replace("서울", " ")
                    .replace("부산", " ")
                    .replace("인천", " ")
                    .replace("대구", " ")
                    .replace("광주", " ")
                    .replace("대전", " ")
                    .replace("울산", " ")
                    .replace("경기", " ")
                    .replace("강원", " ")
                    .replace("충북", " ")
                    .replace("충남", " ")
                    .replace("전북", " ")
                    .replace("전남", " ")
                    .replace("경북", " ")
                    .replace("경남", " ")
                    .replace("제주", " ")
                    .replace("축제", " ")
                    .replace("행사", " ")
                    .replace("전시", " ")
                    .replace("공연", " ")
                    .replace("체험", " ")
                    .replace("추천해줘", " ")
                    .replace("추천", " ")
                    .replace("갈만한데", " ")
                    .replace("갈만한", " ")
                    .replace("가볼만한곳", " ")
                    .replace("가볼만한", " ")
                    .replace("놀거리", " ")
                    .replace("데이트", " ")
                    .replace("나들이", " ")
                    .replace("무료", " ")
                    .replace("오늘", " ")
                    .replace("내일", " ")
                    .replace("모레", " ")
                    .replace("갈", " ")
                    .replace("있어?", " ")
                    .replace("있어", " ")
                    .replace("어디", " ")
                    .replace("뭐", " ")
                    .trim();

            cleaned = cleaned.replaceAll("\\s+", " ").trim();

            if (cleaned.isBlank()) {
                continue;
            }

            String[] tokens = cleaned.split(" ");
            for (String token : tokens) {
                String finalToken = token.trim();

                if (finalToken.isBlank()) {
                    continue;
                }

                // 4/27 한글 1글자 키워드도 검색에 사용
                if (finalToken.length() <= 1 && !finalToken.matches("[가-힣]")) {
                    continue;
                }

                if (NOISE_KEYWORDS.contains(finalToken)) {
                    continue;
                }

                if (!result.contains(finalToken)) {
                    result.add(finalToken);
                }
            }
        }

        return result;
    }

    private int getPriceScore(String price) {
        if (!hasText(price)) {
            return 2;
        }

        String normalized = price.toLowerCase().replace(" ", "");

        if (normalized.contains("부분무료")
                || normalized.contains("일부유료")
                || normalized.contains("사전등록시무료")
                || normalized.contains("사전예약시무료")
                || normalized.contains("유아무료")
                || normalized.contains("어린이무료")
                || normalized.contains("무료입장")) {
            return 1;
        }

        if ("무료".equals(normalized) || normalized.startsWith("무료")) {
            return 0;
        }

        return 2;
    }

    private long getDateDistanceScore(Festival festival, LocalDate today) {
        try {
            if (!hasText(festival.getStartDate()) || !hasText(festival.getEndDate())) {
                return Long.MAX_VALUE;
            }

            LocalDate startDate = LocalDate.parse(festival.getStartDate(), DATE_FORMATTER);
            LocalDate endDate = LocalDate.parse(festival.getEndDate(), DATE_FORMATTER);

            if ((today.isEqual(startDate) || today.isAfter(startDate))
                    && (today.isEqual(endDate) || today.isBefore(endDate))) {
                return 0;
            }

            if (today.isBefore(startDate)) {
                return ChronoUnit.DAYS.between(today, startDate);
            }

            return 100000 + ChronoUnit.DAYS.between(endDate, today);
        } catch (Exception e) {
            return Long.MAX_VALUE;
        }
    }

    private String safeDateString(String date) {
        return hasText(date) ? date : "99999999";
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
