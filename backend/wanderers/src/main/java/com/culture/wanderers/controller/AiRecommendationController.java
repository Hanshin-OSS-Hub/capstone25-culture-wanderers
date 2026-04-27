package com.culture.wanderers.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.culture.wanderers.dto.AiRecommendFestivalItem;
import com.culture.wanderers.dto.AiRecommendRequest;
import com.culture.wanderers.dto.AiRecommendResponse;
import com.culture.wanderers.dto.GeminiExtractResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.service.FestivalSearchService;
import com.culture.wanderers.service.GeminiRecommendationService;
import com.culture.wanderers.service.GeminiValidationService;
import com.culture.wanderers.service.PersonalizedRecommendationService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/ai")
public class AiRecommendationController {

    private final GeminiRecommendationService geminiRecommendationService;
    private final GeminiValidationService geminiValidationService;
    private final FestivalSearchService festivalSearchService;
    private final PersonalizedRecommendationService personalizedRecommendationService;
    private final ReviewRepository reviewRepository;
    private final PartyRepository partyRepository;
    private final UserRepository userRepository;

    public AiRecommendationController(
            GeminiRecommendationService geminiRecommendationService,
            GeminiValidationService geminiValidationService,
            FestivalSearchService festivalSearchService,
            PersonalizedRecommendationService personalizedRecommendationService,
            ReviewRepository reviewRepository,
            PartyRepository partyRepository,
            UserRepository userRepository
    ) {
        this.geminiRecommendationService = geminiRecommendationService;
        this.geminiValidationService = geminiValidationService;
        this.festivalSearchService = festivalSearchService;
        this.personalizedRecommendationService = personalizedRecommendationService;
        this.reviewRepository = reviewRepository;
        this.partyRepository = partyRepository;
        this.userRepository = userRepository;
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

        try {
            GeminiExtractResponse raw = geminiRecommendationService.extractConditions(request.getQuery());
            extracted = geminiValidationService.validateAndNormalize(raw, request.getQuery());
            personalizedRecommendationService.applyPreferenceHints(userId, extracted);
        } catch (Exception e) {
            fallbackUsed = true;
            e.printStackTrace();

            extracted = geminiValidationService.validateAndNormalize(null, request.getQuery());
            personalizedRecommendationService.applyPreferenceHints(userId, extracted);

            List<Festival> fallbackFestivals = festivalSearchService.searchByExtractedConditions(extracted);
            List<AiRecommendFestivalItem> fallbackItems = toRecommendItems(fallbackFestivals);

            return new AiRecommendResponse(
                    request.getQuery(),
                    extracted,
                    fallbackItems,
                    true,
                    "AI response is temporarily delayed, so fallback recommendations are shown."
            );
        }

        List<Festival> festivals = festivalSearchService.searchByExtractedConditions(extracted);
        List<AiRecommendFestivalItem> items = toRecommendItems(festivals);

        return new AiRecommendResponse(
                request.getQuery(),
                extracted,
                items,
                fallbackUsed,
                fallbackUsed ? "Fallback search was used." : "Recommendation results."
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

    private Long resolveUserId(String email) {
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return 1L;
        }

        return userRepository.findByEmail(email)
                .map(user -> user.getId().longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
