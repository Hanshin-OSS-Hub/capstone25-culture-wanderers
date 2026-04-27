package com.culture.wanderers.controller;

import com.culture.wanderers.entity.VisitedFestival;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.VisitedFestivalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class VisitedFestivalController {

    private final VisitedFestivalRepository visitedFestivalRepository;
    private final JwtUtil jwtUtil;

    public VisitedFestivalController(
            VisitedFestivalRepository visitedFestivalRepository,
            JwtUtil jwtUtil
    ) {
        this.visitedFestivalRepository = visitedFestivalRepository;
        this.jwtUtil = jwtUtil;
    }

    // 4/27 내가 간 행사 목록 조회
    @GetMapping("/api/me/visited-festivals")
    public List<VisitedFestival> getMyVisitedFestivals(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        return visitedFestivalRepository.findByUserEmailOrderByVisitedAtDesc(email);
    }

    // 4/27 내가 간 행사 추가
    @PostMapping("/api/me/visited-festivals")
    public VisitedFestival addVisitedFestival(
            @RequestBody Map<String, String> body,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Long festivalId = Long.parseLong(body.get("festivalId"));
        String festivalTitle = body.get("festivalTitle");

        if (visitedFestivalRepository.existsByUserEmailAndFestivalId(email, festivalId)) {
            return visitedFestivalRepository.findByUserEmailAndFestivalId(email, festivalId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "다녀온 행사 없음"));
        }

        VisitedFestival visitedFestival = new VisitedFestival();
        visitedFestival.setUserEmail(email);
        visitedFestival.setFestivalId(festivalId);
        visitedFestival.setFestivalTitle(festivalTitle);

        return visitedFestivalRepository.save(visitedFestival);
    }

    // 4/27 내가 간 행사 삭제
    @DeleteMapping("/api/me/visited-festivals/{festivalId}")
    public void deleteVisitedFestival(
            @PathVariable Long festivalId,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        VisitedFestival visitedFestival = visitedFestivalRepository
                .findByUserEmailAndFestivalId(email, festivalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "다녀온 행사 없음"));

        visitedFestivalRepository.delete(visitedFestival);
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
