package com.culture.wanderers.controller;

import com.culture.wanderers.entity.UserLike;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.UserLikeRepository;
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

    public LikeController(UserLikeRepository userLikeRepository, JwtUtil jwtUtil) {
        this.userLikeRepository = userLikeRepository;
        this.jwtUtil = jwtUtil;
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