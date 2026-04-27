package com.culture.wanderers.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.culture.wanderers.dto.UserPreferenceResponse;
import com.culture.wanderers.dto.UserPreferenceSelectionRequest;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.service.PersonalizedRecommendationService;
import com.culture.wanderers.service.UserPreferenceOptionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/recommend")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PersonalizedRecommendationController {

    private final PersonalizedRecommendationService service;
    private final UserPreferenceOptionService userPreferenceOptionService;
    private final UserRepository userRepository;

    @GetMapping("/personalized")
    public List<Festival> recommend(
            @AuthenticationPrincipal String email,
            @RequestParam(value = "limit", required = false, defaultValue = "10") int limit
    ) {
        Long userId = resolveUserId(email);
        return service.recommend(userId, limit);
    }

    @GetMapping("/personalized/ending-soon")
    public List<Festival> recommendEndingSoon(
            @AuthenticationPrincipal String email,
            @RequestParam(value = "limit", required = false, defaultValue = "10") int limit
    ) {
        Long userId = resolveUserId(email);
        return service.recommendEndingSoon(userId, limit);
    }

    @GetMapping("/preferences")
    public UserPreferenceResponse preferences(@AuthenticationPrincipal String email) {
        Long userId = resolveUserId(email);
        return service.analyze(userId);
    }

    @PutMapping("/preferences/selection")
    public UserPreferenceResponse saveSelections(
            @AuthenticationPrincipal String email,
            @RequestBody UserPreferenceSelectionRequest request
    ) {
        Long userId = resolveUserId(email);
        userPreferenceOptionService.saveSelections(userId, request);
        return service.analyze(userId);
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
