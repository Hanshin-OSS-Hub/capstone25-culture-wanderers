package com.culture.wanderers.controller;

import com.culture.wanderers.entity.UserLike;
import com.culture.wanderers.entity.Review;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.repository.UserLikeRepository;
import com.culture.wanderers.service.UserRankService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class LikeController {

    private final UserLikeRepository userLikeRepository;
    private final JwtUtil jwtUtil;
    private final ReviewRepository reviewRepository;
    private final UserRankService userRankService;

    public LikeController(UserLikeRepository userLikeRepository, JwtUtil jwtUtil, ReviewRepository reviewRepository, UserRankService userRankService) {
        this.userLikeRepository = userLikeRepository;
        this.jwtUtil = jwtUtil;
        this.reviewRepository = reviewRepository;
        this.userRankService = userRankService;
    }

    // 좋아요 추가
    @PostMapping("/api/likes")
    public UserLike like(
            @RequestBody Map<String, String> body,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        String targetType = body.get("targetType");
        String targetIdStr = body.get("targetId");

        if (targetType == null || targetIdStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetType/targetId 누락");
        }

        Long targetId = Long.parseLong(targetIdStr);

        if (userLikeRepository.existsByUserEmailAndTargetTypeAndTargetId(email, targetType, targetId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 좋아요한 대상");
        }

        UserLike userLike = new UserLike();
        userLike.setUserEmail(email);
        userLike.setTargetType(targetType);
        userLike.setTargetId(targetId);

        if ("review".equalsIgnoreCase(targetType)) {
            Review review = reviewRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "리뷰 없음"));

            if (review.getAuthorEmail() != null && !review.getAuthorEmail().equalsIgnoreCase(email)) {
                userRankService.addPoints(
                        review.getAuthorEmail(),
                        userRankService.pointsForReviewLike(review.getTargetType())
                );
            }
        }

        return userLikeRepository.save(userLike);
    }

    // 좋아요 취소
    @DeleteMapping("/api/likes")
    public void unlike(
            @RequestParam String targetType,
            @RequestParam Long targetId,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        UserLike like = userLikeRepository
                .findByUserEmailAndTargetTypeAndTargetId(email, targetType, targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "좋아요 없음"));

        userLikeRepository.delete(like);
    }

    // 내 좋아요 목록
    @GetMapping("/api/me/likes")
    public List<UserLike> getMyLikes(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        return userLikeRepository.findByUserEmail(email);
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