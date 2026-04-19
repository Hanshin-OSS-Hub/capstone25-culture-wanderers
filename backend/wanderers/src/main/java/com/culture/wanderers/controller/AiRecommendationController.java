package com.culture.wanderers.controller;

import com.culture.wanderers.dto.AiRecommendFestivalItem;
import com.culture.wanderers.dto.AiRecommendRequest;
import com.culture.wanderers.dto.AiRecommendResponse;
import com.culture.wanderers.dto.GeminiExtractResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.service.FestivalSearchService;
import com.culture.wanderers.service.GeminiRecommendationService;
import com.culture.wanderers.service.GeminiValidationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/ai")
public class AiRecommendationController {

    private final GeminiRecommendationService geminiRecommendationService;
    private final GeminiValidationService geminiValidationService;
    private final FestivalSearchService festivalSearchService;
    private final ReviewRepository reviewRepository;
    private final PartyRepository partyRepository;

    public AiRecommendationController(
            GeminiRecommendationService geminiRecommendationService,
            GeminiValidationService geminiValidationService,
            FestivalSearchService festivalSearchService,
            ReviewRepository reviewRepository,
            PartyRepository partyRepository
    ) {
        this.geminiRecommendationService = geminiRecommendationService;
        this.geminiValidationService = geminiValidationService;
        this.festivalSearchService = festivalSearchService;
        this.reviewRepository = reviewRepository;
        this.partyRepository = partyRepository;
    }

    @PostMapping("/recommend")
    public AiRecommendResponse recommend(@RequestBody AiRecommendRequest request) {
        if (request == null || request.getQuery() == null || request.getQuery().isBlank()) {
            throw new IllegalArgumentException("query는 필수입니다.");
        }

        boolean fallbackUsed = false;
        GeminiExtractResponse extracted;

        try {
            GeminiExtractResponse raw = geminiRecommendationService.extractConditions(request.getQuery());
            extracted = geminiValidationService.validateAndNormalize(raw, request.getQuery());
        } catch (Exception e) {
            fallbackUsed = true;
            e.printStackTrace();

            extracted = new GeminiExtractResponse();
            extracted.setIntent("recommend_festival");
            extracted.setRegion(null);
            extracted.setCategory(null);
            extracted.setCompanions(null);
            extracted.setDate(null);
            extracted.setKeywords(List.of());

            List<Festival> fallbackFestivals = festivalSearchService.searchByExtractedConditions(extracted);
            List<AiRecommendFestivalItem> fallbackItems = toRecommendItems(fallbackFestivals);

            return new AiRecommendResponse(
                    request.getQuery(),
                    extracted,
                    fallbackItems,
                    true,
                    "Gemini 실패: " + e.getClass().getSimpleName() + " - " + e.getMessage()
            );
        }

        List<Festival> festivals = festivalSearchService.searchByExtractedConditions(extracted);

        // fallback 1: category 제거
        if (festivals.isEmpty()) {
            extracted.setCategory(null);
            festivals = festivalSearchService.searchByExtractedConditions(extracted);
        }

        // fallback 2: region 제거
        if (festivals.isEmpty()) {
            extracted.setRegion(null);
            festivals = festivalSearchService.searchByExtractedConditions(extracted);
        }
        List<AiRecommendFestivalItem> items = toRecommendItems(festivals);

        return new AiRecommendResponse(
                request.getQuery(),
                extracted,
                items,
                fallbackUsed,
                fallbackUsed ? "Gemini 응답 이상으로 fallback 검색을 사용했습니다." : "추천 결과입니다."
        );
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
}
