package com.culture.wanderers.controller;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.culture.wanderers.dto.FestivalSummaryDto;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.service.FestivalInsightService;

import jakarta.persistence.criteria.Predicate;

@RestController
@CrossOrigin(origins = "*")
public class FestivalController {

    private final FestivalRepository festivalRepository;
    private final FestivalInsightService festivalInsightService;

    public FestivalController(FestivalRepository festivalRepository, FestivalInsightService festivalInsightService) {
        this.festivalRepository = festivalRepository;
        this.festivalInsightService = festivalInsightService;
    }

    // 4/27 검색어, 지역, 카테고리, 날짜 조건을 함께 적용하는 축제 검색
    @GetMapping("/api/festivals")
    public List<FestivalSummaryDto> getFestivals(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "region", required = false) String region,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "status", required = false, defaultValue = "ongoing") String status
    ) {
        Specification<Festival> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 4/27 종료된 행사 제외 (오늘 이후 종료된 행사만)
            String today = java.time.LocalDate.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));

            String normalizedStatus = status == null ? "ongoing" : status.trim().toLowerCase();
            if ("past".equals(normalizedStatus)) {
                predicates.add(cb.lessThan(root.get("endDate"), today));
            } else {
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), today));
            }

            if (region != null && !region.isBlank() && !"전체".equals(region)) {
                String regionKeyword = normalizeRegionKeyword(region);
                predicates.add(cb.like(cb.lower(root.get("region")), "%" + regionKeyword.toLowerCase() + "%"));
            }

            if (category != null && !category.isBlank() && !"전체".equals(category)) {
                predicates.add(cb.like(cb.lower(root.get("category")), "%" + category.trim().toLowerCase() + "%"));
            }

            if (q != null && !q.isBlank()) {
                String keyword = q.trim().toLowerCase();
                String normalizedKeyword = normalizeRegionKeyword(keyword).toLowerCase();

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), "%" + keyword + "%"),
                        cb.like(cb.lower(root.get("location")), "%" + keyword + "%"),
                        cb.like(cb.lower(root.get("region")), "%" + keyword + "%"),
                        cb.like(cb.lower(root.get("title")), "%" + normalizedKeyword + "%"),
                        cb.like(cb.lower(root.get("location")), "%" + normalizedKeyword + "%"),
                        cb.like(cb.lower(root.get("region")), "%" + normalizedKeyword + "%")
                ));
            }

            if (date != null && !date.isBlank()) {
                String targetDate = date.replace("-", "").trim();

                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), targetDate));
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), targetDate));
            }

            query.orderBy(cb.asc(root.get("startDate")));

            return predicates.isEmpty()
                    ? cb.conjunction()
                    : cb.and(predicates.toArray(new Predicate[0]));
        };

        return festivalInsightService.summarize(festivalRepository.findAll(spec));
    }

    @GetMapping("/api/festivals/summaries")
    public List<FestivalSummaryDto> getFestivalSummaries(@RequestParam(value = "ids", required = false) List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        return festivalInsightService.summarizeByIds(ids);
    }

    @GetMapping("/api/festivals/popular")
    public List<FestivalSummaryDto> getPopularFestivals(@RequestParam(value = "limit", required = false, defaultValue = "5") int limit) {
        return festivalInsightService.getPopularFestivals(limit);
    }

    @GetMapping("/api/festivals/link-candidates")
    public List<FestivalSummaryDto> getFestivalLinkCandidates(
            @RequestParam(value = "query") String query,
            @RequestParam(value = "region", required = false) String region
    ) {
        String normalizedQuery = normalizeLooseText(query);
        if (normalizedQuery.isBlank()) {
            return List.of();
        }

        String normalizedRegion = normalizeLooseText(region);

        List<Festival> candidates = festivalRepository.findAll().stream()
                .filter(festival -> {
                    String festivalTitle = normalizeLooseText(festival.getTitle());
                    if (festivalTitle.isBlank()) {
                        return false;
                    }
                    return hasLooseTitleMatch(festivalTitle, normalizedQuery);
                })
                .sorted(Comparator.comparingInt((Festival festival) -> linkCandidateScore(festival, normalizedQuery, normalizedRegion)).reversed())
                .limit(10)
                .toList();

        return festivalInsightService.summarize(candidates);
    }

    // 4/27 경기도/경기처럼 입력해도 검색되도록 지역명 보정
    private String normalizeRegionKeyword(String keyword) {
        if (keyword == null) {
            return "";
        }

        String value = keyword.trim();

        if (value.endsWith("특별시")) {
            return value.replace("특별시", "");
        }
        if (value.endsWith("광역시")) {
            return value.replace("광역시", "");
        }
        if (value.endsWith("특별자치시")) {
            return value.replace("특별자치시", "");
        }
        if (value.endsWith("특별자치도")) {
            return value.replace("특별자치도", "");
        }
        if (value.endsWith("도")) {
            return value.substring(0, value.length() - 1);
        }

        return value;
    }

    private String normalizeLooseText(String value) {
        if (value == null) {
            return "";
        }

        return value
                .toLowerCase()
                .replaceAll("\\s+", "")
                .replaceAll("[^0-9a-z가-힣]", "");
    }

    private int linkCandidateScore(Festival festival, String normalizedQuery, String normalizedRegion) {
        String festivalTitle = normalizeLooseText(festival.getTitle());
        String festivalRegion = normalizeLooseText(festival.getRegion());
        String festivalLocation = normalizeLooseText(festival.getLocation());

        int score = 0;
        double ratio = titleSimilarityRatio(festivalTitle, normalizedQuery);
        if (festivalTitle.equals(normalizedQuery)) {
            score += 200;
        }
        if (normalizedQuery.contains(festivalTitle)) {
            score += 120;
        }
        if (festivalTitle.contains(normalizedQuery)) {
            score += 80;
        }
        if (!normalizedRegion.isBlank() && (festivalRegion.contains(normalizedRegion) || festivalLocation.contains(normalizedRegion))) {
            score += 25;
        }
        score += (int) Math.round(ratio * 100);
        score += Math.min(festivalTitle.length(), 60);
        return score;
    }

    private boolean hasLooseTitleMatch(String festivalTitle, String normalizedQuery) {
        if (festivalTitle.isBlank() || normalizedQuery.isBlank()) {
            return false;
        }
        if (festivalTitle.contains(normalizedQuery) || normalizedQuery.contains(festivalTitle)) {
            return true;
        }
        return titleSimilarityRatio(festivalTitle, normalizedQuery) >= 0.5;
    }

    private double titleSimilarityRatio(String left, String right) {
        if (left == null || right == null || left.isBlank() || right.isBlank()) {
            return 0.0;
        }
        int commonLength = longestCommonSubstringLength(left, right);
        int shorterLength = Math.min(left.length(), right.length());
        if (shorterLength == 0) {
            return 0.0;
        }
        return (double) commonLength / shorterLength;
    }

    private int longestCommonSubstringLength(String left, String right) {
        int[][] dp = new int[left.length() + 1][right.length() + 1];
        int max = 0;

        for (int i = 1; i <= left.length(); i++) {
            for (int j = 1; j <= right.length(); j++) {
                if (left.charAt(i - 1) == right.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    max = Math.max(max, dp[i][j]);
                }
            }
        }

        return max;
    }

    // 상세
    @GetMapping("/api/festivals/{id}")
    public Festival getFestivalById(@PathVariable Long id) {
        return festivalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "축제 정보를 찾을 수 없습니다."));
    }

    // 생성 (필요 시)
    @PostMapping("/api/festivals")
    @ResponseStatus(HttpStatus.CREATED)
    public Festival createFestival(@RequestBody Festival festival) {
        return festivalRepository.save(festival);
    }

    // 일부 수정 (필요 시)
    @PatchMapping("/api/festivals/{id}")
    public Festival updateFestival(@PathVariable Long id, @RequestBody Festival update) {
        Festival festival = festivalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "축제 정보를 찾을 수 없습니다."));

        if (update.getTitle() != null) {
            festival.setTitle(update.getTitle());
        }
        if (update.getRegion() != null) {
            festival.setRegion(update.getRegion());
        }
        if (update.getLocation() != null) {
            festival.setLocation(update.getLocation());
        }
        if (update.getStartDate() != null) {
            festival.setStartDate(update.getStartDate());
        }
        if (update.getEndDate() != null) {
            festival.setEndDate(update.getEndDate());
        }
        if (update.getThumbnailUrl() != null) {
            festival.setThumbnailUrl(update.getThumbnailUrl());
        }
        if (update.getCategory() != null) {
            festival.setCategory(update.getCategory());
        }
        if (update.getPrice() != null) {
            festival.setPrice(update.getPrice());
        }
        if (update.getDescription() != null) {
            festival.setDescription(update.getDescription());
        }
        if (update.getTel() != null) {
            festival.setTel(update.getTel());
        }
        if (update.getHomepageUrl() != null) {
            festival.setHomepageUrl(update.getHomepageUrl());
        }

        return festivalRepository.save(festival);
    }

    // 삭제 (필요 시)
    @DeleteMapping("/api/festivals/{id}")
    public void deleteFestival(@PathVariable Long id) {
        if (!festivalRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "축제 정보를 찾을 수 없습니다.");
        }
        festivalRepository.deleteById(id);
    }
}
