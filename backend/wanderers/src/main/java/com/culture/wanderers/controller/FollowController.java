package com.culture.wanderers.controller;

import com.culture.wanderers.dto.FollowStatsResponse;
import com.culture.wanderers.dto.UserFollowProfileResponse;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.entity.UserFollow;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.UserFollowRepository;
import com.culture.wanderers.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class FollowController {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public FollowController(UserFollowRepository userFollowRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/api/users/{userEmail}/follow-stats")
    public FollowStatsResponse getFollowStats(
            @PathVariable String userEmail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String currentEmail = extractEmailOrNull(authHeader);
        return buildStats(userEmail, currentEmail);
    }

    @GetMapping("/api/users/{userEmail}/followers")
    public List<UserFollowProfileResponse> getFollowers(
            @PathVariable String userEmail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String currentEmail = extractEmailOrNull(authHeader);
        validateFollowListVisible(userEmail, currentEmail);

        List<String> emails = userFollowRepository.findByFollowingEmail(userEmail).stream()
                .map(UserFollow::getFollowerEmail)
                .toList();

        return buildUserProfiles(emails);
    }

    @GetMapping("/api/users/{userEmail}/following")
    public List<UserFollowProfileResponse> getFollowing(
            @PathVariable String userEmail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String currentEmail = extractEmailOrNull(authHeader);
        validateFollowListVisible(userEmail, currentEmail);

        List<String> emails = userFollowRepository.findByFollowerEmail(userEmail).stream()
                .map(UserFollow::getFollowingEmail)
                .toList();

        return buildUserProfiles(emails);
    }

    @PostMapping("/api/users/{userEmail}/follow")
    public FollowStatsResponse follow(
            @PathVariable String userEmail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String currentEmail = extractEmail(authHeader);
        validateTarget(userEmail);

        if (currentEmail.equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인은 팔로우할 수 없습니다.");
        }

        if (!userFollowRepository.existsByFollowerEmailAndFollowingEmail(currentEmail, userEmail)) {
            UserFollow follow = new UserFollow();
            follow.setFollowerEmail(currentEmail);
            follow.setFollowingEmail(userEmail);
            userFollowRepository.save(follow);
        }

        return buildStats(userEmail, currentEmail);
    }

    @DeleteMapping("/api/users/{userEmail}/follow")
    public FollowStatsResponse unfollow(
            @PathVariable String userEmail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String currentEmail = extractEmail(authHeader);

        userFollowRepository
                .findByFollowerEmailAndFollowingEmail(currentEmail, userEmail)
                .ifPresent(userFollowRepository::delete);

        return buildStats(userEmail, currentEmail);
    }

    @GetMapping("/api/me/follow-privacy")
    public Map<String, Boolean> getFollowPrivacy(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        User currentUser = getCurrentUser(authHeader);
        return Map.of("public", isFollowPublic(currentUser));
    }

    @PutMapping("/api/me/follow-privacy")
    public Map<String, Boolean> updateFollowPrivacy(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Boolean> body
    ) {
        User currentUser = getCurrentUser(authHeader);
        boolean publicValue = Boolean.TRUE.equals(body.get("public"));
        currentUser.setFollowPublic(publicValue);
        userRepository.save(currentUser);
        return Map.of("public", publicValue);
    }

    private FollowStatsResponse buildStats(String userEmail, String currentEmail) {
        long followerCount = userFollowRepository.countByFollowingEmail(userEmail);
        long followingCount = userFollowRepository.countByFollowerEmail(userEmail);
        boolean following = currentEmail != null
                && userFollowRepository.existsByFollowerEmailAndFollowingEmail(currentEmail, userEmail);

        return new FollowStatsResponse(followerCount, followingCount, following);
    }

    private void validateTarget(String userEmail) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private void validateFollowListVisible(String userEmail, String currentEmail) {
        User targetUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        if (currentEmail != null && currentEmail.equalsIgnoreCase(userEmail)) {
            return;
        }

        if (!isFollowPublic(targetUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "팔로워/팔로잉 목록이 비공개입니다.");
        }
    }

    private List<UserFollowProfileResponse> buildUserProfiles(List<String> emails) {
        LinkedHashSet<String> uniqueEmails = new LinkedHashSet<>(emails);
        Map<String, User> usersByEmail = userRepository.findByEmailIn(uniqueEmails).stream()
                .collect(Collectors.toMap(
                        user -> user.getEmail().toLowerCase(),
                        Function.identity(),
                        (first, second) -> first
                ));

        return uniqueEmails.stream()
                .map(email -> usersByEmail.get(email.toLowerCase()))
                .filter(user -> user != null)
                .map(UserFollowProfileResponse::new)
                .toList();
    }

    private User getCurrentUser(String authHeader) {
        String currentEmail = extractEmail(authHeader);
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private boolean isFollowPublic(User user) {
        return user.getFollowPublic() == null || Boolean.TRUE.equals(user.getFollowPublic());
    }

    private String extractEmailOrNull(String authHeader) {
        try {
            return extractEmail(authHeader);
        } catch (ResponseStatusException e) {
            return null;
        }
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
