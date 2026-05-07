package com.culture.wanderers.controller;

import com.culture.wanderers.dto.SavedFestivalResponse;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.entity.UserFollow;
import com.culture.wanderers.entity.UserSave;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.UserFollowRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.repository.UserSaveRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class SaveController {

    private final UserSaveRepository userSaveRepository;
    private final FestivalRepository festivalRepository;
    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public SaveController(
            UserSaveRepository userSaveRepository,
            FestivalRepository festivalRepository,
            UserFollowRepository userFollowRepository,
            UserRepository userRepository,
            JwtUtil jwtUtil
    ) {
        this.userSaveRepository = userSaveRepository;
        this.festivalRepository = festivalRepository;
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/api/saves")
    public UserSave save(
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

        if (userSaveRepository.existsByUserEmailAndTargetTypeAndTargetId(email, targetType, targetId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 저장한 대상");
        }

        UserSave userSave = new UserSave();
        userSave.setUserEmail(email);
        userSave.setTargetType(targetType);
        userSave.setTargetId(targetId);

        return userSaveRepository.save(userSave);
    }

    @DeleteMapping("/api/saves")
    public void unsave(
            @RequestParam String targetType,
            @RequestParam Long targetId,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        UserSave save = userSaveRepository
                .findByUserEmailAndTargetTypeAndTargetId(email, targetType, targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "저장 내역 없음"));

        userSaveRepository.delete(save);
    }

    @GetMapping("/api/me/saves")
    public List<UserSave> getMySaves(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        return userSaveRepository.findByUserEmail(email);
    }

    @GetMapping("/api/users/{userEmail}/saved-festivals")
    public List<SavedFestivalResponse> getUserSavedFestivals(@PathVariable String userEmail) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        List<UserSave> saves = userSaveRepository.findByUserEmailAndTargetType(userEmail, "festival");
        return buildSavedFestivalResponses(saves);
    }

    @GetMapping("/api/me/following-saved-festivals")
    public List<SavedFestivalResponse> getFollowingSavedFestivals(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        List<String> followingEmails = userFollowRepository.findByFollowerEmail(email).stream()
                .map(UserFollow::getFollowingEmail)
                .toList();

        if (followingEmails.isEmpty()) {
            return List.of();
        }

        List<UserSave> saves = userSaveRepository.findByUserEmailInAndTargetType(followingEmails, "festival");
        return buildSavedFestivalResponses(saves);
    }

    private List<SavedFestivalResponse> buildSavedFestivalResponses(List<UserSave> saves) {
        LinkedHashSet<Long> festivalIds = saves.stream()
                .map(UserSave::getTargetId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        LinkedHashSet<String> userEmails = saves.stream()
                .map(UserSave::getUserEmail)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Map<Long, Festival> festivalsById = festivalRepository.findAllById(festivalIds).stream()
                .collect(Collectors.toMap(Festival::getId, Function.identity()));
        Map<String, User> usersByEmail = userRepository.findByEmailIn(userEmails).stream()
                .collect(Collectors.toMap(
                        user -> user.getEmail().toLowerCase(),
                        Function.identity(),
                        (first, second) -> first
                ));

        List<SavedFestivalResponse> responses = new ArrayList<>();
        for (UserSave save : saves) {
            Festival festival = festivalsById.get(save.getTargetId());
            if (festival == null) {
                continue;
            }
            User savedBy = usersByEmail.get(save.getUserEmail().toLowerCase());
            responses.add(new SavedFestivalResponse(festival, savedBy));
        }
        return responses;
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
