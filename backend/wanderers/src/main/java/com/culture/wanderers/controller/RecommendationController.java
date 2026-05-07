package com.culture.wanderers.controller;

import com.culture.wanderers.dto.RecommendationResponse;
import com.culture.wanderers.entity.UserLike;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.UserLikeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final UserLikeRepository userLikeRepository;
    private final JwtUtil jwtUtil;

    public RecommendationController(UserLikeRepository userLikeRepository, JwtUtil jwtUtil) {
        this.userLikeRepository = userLikeRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/api/me/recommendations")
    public List<RecommendationResponse> getRecommendations(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        List<UserLike> likes = userLikeRepository.findByUserEmail(email);

        if (likes.isEmpty()) {
            return List.of(
                    new RecommendationResponse("festival", 1L, "기본 추천"),
                    new RecommendationResponse("party", 1L, "기본 추천")
            );
        }

        Map<String, Integer> typeCount = new HashMap<>();
        for (UserLike like : likes) {
            typeCount.put(like.getTargetType(), typeCount.getOrDefault(like.getTargetType(), 0) + 1);
        }

        List<RecommendationResponse> result = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : typeCount.entrySet()) {
            String targetType = entry.getKey();
            result.add(new RecommendationResponse(
                    targetType,
                    1L,
                    targetType + " 유형을 자주 좋아요해서 추천"
            ));
        }

        return result;
    }

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류");
        }
    }
}