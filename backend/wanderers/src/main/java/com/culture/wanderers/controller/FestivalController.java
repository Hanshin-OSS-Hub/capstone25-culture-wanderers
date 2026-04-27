package com.culture.wanderers.controller;

import java.util.ArrayList;
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

import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.FestivalRepository;

import jakarta.persistence.criteria.Predicate;

@RestController
@CrossOrigin(origins = "*")
public class FestivalController {

    private final FestivalRepository festivalRepository;

    public FestivalController(FestivalRepository festivalRepository) {
        this.festivalRepository = festivalRepository;
    }

    // 4/27 검색어, 지역, 카테고리, 날짜 조건을 함께 적용하는 축제 검색
    @GetMapping("/api/festivals")
    public List<Festival> getFestivals(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "region", required = false) String region,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "date", required = false) String date
    ) {
        Specification<Festival> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 4/27 종료된 행사 제외 (오늘 이후 종료된 행사만)
            String today = java.time.LocalDate.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));

            predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), today));

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

        return festivalRepository.findAll(spec);
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
