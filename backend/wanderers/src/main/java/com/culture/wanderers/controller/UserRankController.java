package com.culture.wanderers.controller;

import com.culture.wanderers.entity.User;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.service.UserRankService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class UserRankController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final UserRankService userRankService;

    public UserRankController(JwtUtil jwtUtil, UserRepository userRepository, UserRankService userRankService) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.userRankService = userRankService;
    }

    @GetMapping("/api/me/rank")
    public Map<String, Object> getMyRank(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        return userRankService.buildRankResponse(user);
    }

    @GetMapping("/api/users/{userEmail}/rank")
    public Map<String, Object> getUserRank(@PathVariable String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        return userRankService.buildRankResponse(user);
    }

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰이 없습니다.");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다.");
        }
    }
}
