package com.culture.wanderers.controller;

import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.FestivalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class FestivalController {

    private final FestivalRepository festivalRepository;

    public FestivalController(FestivalRepository festivalRepository) {
        this.festivalRepository = festivalRepository;
    }

    // 전체 리스트
    @GetMapping("/api/festivals")
    public List<Festival> getFestivals(
            @RequestParam(value = "region", required = false) String region,
            @RequestParam(value = "category", required = false) String category
    ) {
        if (region != null && !region.isBlank()) {
            return festivalRepository.findByRegionContainingIgnoreCase(region);
        }
        if (category != null && !category.isBlank()) {
            return festivalRepository.findByCategoryContainingIgnoreCase(category);
        }
        return festivalRepository.findAll();
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

        if (update.getTitle() != null) festival.setTitle(update.getTitle());
        if (update.getRegion() != null) festival.setRegion(update.getRegion());
        if (update.getLocation() != null) festival.setLocation(update.getLocation());
        if (update.getStartDate() != null) festival.setStartDate(update.getStartDate());
        if (update.getEndDate() != null) festival.setEndDate(update.getEndDate());
        if (update.getThumbnailUrl() != null) festival.setThumbnailUrl(update.getThumbnailUrl());
        if (update.getCategory() != null) festival.setCategory(update.getCategory());
        if (update.getPrice() != null) festival.setPrice(update.getPrice());
        if (update.getDescription() != null) festival.setDescription(update.getDescription());
        if (update.getTel() != null) festival.setTel(update.getTel());
        if (update.getHomepageUrl() != null) festival.setHomepageUrl(update.getHomepageUrl());

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
