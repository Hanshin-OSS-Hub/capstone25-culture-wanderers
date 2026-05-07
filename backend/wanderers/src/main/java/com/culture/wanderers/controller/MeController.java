package com.culture.wanderers.controller;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.culture.wanderers.dto.UpdateMeRequest;
import com.culture.wanderers.dto.WithdrawRequest;
import com.culture.wanderers.entity.Party;
import com.culture.wanderers.entity.Post;
import com.culture.wanderers.entity.Review;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CalendarEventRepository;
import com.culture.wanderers.repository.CommentRepository;
import com.culture.wanderers.repository.PartyMemberRepository;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.repository.PostRepository;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.repository.UserActivityRepository;
import com.culture.wanderers.repository.UserFollowRepository;
import com.culture.wanderers.repository.UserLikeRepository;
import com.culture.wanderers.repository.UserPreferenceOptionRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.repository.UserSaveRepository;
import com.culture.wanderers.repository.VisitedFestivalRepository;

import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class MeController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final CalendarEventRepository calendarEventRepository;
    private final CommentRepository commentRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final PartyRepository partyRepository;
    private final PostRepository postRepository;
    private final ReviewRepository reviewRepository;
    private final UserActivityRepository userActivityRepository;
    private final UserFollowRepository userFollowRepository;
    private final UserLikeRepository userLikeRepository;
    private final UserPreferenceOptionRepository userPreferenceOptionRepository;
    private final UserSaveRepository userSaveRepository;
    private final VisitedFestivalRepository visitedFestivalRepository;

    public MeController(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate,
            CalendarEventRepository calendarEventRepository,
            CommentRepository commentRepository,
            PartyMemberRepository partyMemberRepository,
            PartyRepository partyRepository,
            PostRepository postRepository,
            ReviewRepository reviewRepository,
            UserActivityRepository userActivityRepository,
            UserFollowRepository userFollowRepository,
            UserLikeRepository userLikeRepository,
            UserPreferenceOptionRepository userPreferenceOptionRepository,
            UserSaveRepository userSaveRepository,
            VisitedFestivalRepository visitedFestivalRepository
    ) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
        this.calendarEventRepository = calendarEventRepository;
        this.commentRepository = commentRepository;
        this.partyMemberRepository = partyMemberRepository;
        this.partyRepository = partyRepository;
        this.postRepository = postRepository;
        this.reviewRepository = reviewRepository;
        this.userActivityRepository = userActivityRepository;
        this.userFollowRepository = userFollowRepository;
        this.userLikeRepository = userLikeRepository;
        this.userPreferenceOptionRepository = userPreferenceOptionRepository;
        this.userSaveRepository = userSaveRepository;
        this.visitedFestivalRepository = visitedFestivalRepository;
    }

    @GetMapping("/api/me")
    public User me(@RequestHeader(name = "Authorization", required = false) String authHeader) {
        String email = extractEmail(authHeader);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    @PatchMapping("/api/me")
    public User updateMe(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestBody UpdateMeRequest request
    ) {
        User user = me(authHeader);

        String nickname = request.getNickname() == null ? "" : request.getNickname().trim();
        if (nickname.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임을 입력해주세요.");
        }
        if (nickname.length() < 2 || nickname.length() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임은 2자 이상 20자 이하로 입력해주세요.");
        }

        user.setNickname(nickname);

        String password = request.getPassword() == null ? "" : request.getPassword().trim();
        if (!password.isBlank()) {
            if (password.length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 6자 이상이어야 합니다.");
            }
            user.setPassword(passwordEncoder.encode(password));
        }

        return userRepository.save(user);
    }

    @DeleteMapping("/api/me")
    @Transactional
    public Map<String, String> withdraw(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestBody WithdrawRequest request
    ) {
        String email = extractEmail(authHeader);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        String password = request == null || request.getPassword() == null ? "" : request.getPassword();
        if (password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호를 입력해주세요.");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다.");
        }

        deleteUserContent(email);
        deleteUserRelations(email, Long.valueOf(user.getId()));
        userRepository.delete(user);

        return Map.of("message", "회원탈퇴가 완료되었습니다.");
    }

    private void deleteUserContent(String email) {
        List<Post> posts = postRepository.findByUserEmailOrderByCreatedAtDesc(email);
        for (Post post : posts) {
            if (post.getId() != null) {
                commentRepository.deleteByTargetTypeAndTargetId("POST", post.getId());
            }
        }

        List<Review> reviews = reviewRepository.findByAuthorEmail(email);
        for (Review review : reviews) {
            if (review.getId() != null) {
                commentRepository.deleteByTargetTypeAndTargetId("REVIEW", review.getId());
            }
        }

        List<Party> parties = partyRepository.findByAuthorEmail(email);
        for (Party party : parties) {
            if (party.getId() != null) {
                commentRepository.deleteByTargetTypeAndTargetId("PARTY", party.getId());
                reviewRepository.deleteByTargetTypeAndTargetId("PARTY", party.getId());
                partyMemberRepository.deleteByParty_Id(party.getId());
            }
        }

        commentRepository.deleteByUserEmail(email);
        reviewRepository.deleteByAuthorEmail(email);
        postRepository.deleteByUserEmail(email);
        partyRepository.deleteByAuthorEmail(email);
    }

    private void deleteUserRelations(String email, Long userId) {
        partyMemberRepository.deleteByUserEmail(email);
        userLikeRepository.deleteByUserEmail(email);
        userSaveRepository.deleteByUserEmail(email);
        calendarEventRepository.deleteByUserEmail(email);
        jdbcTemplate.update("DELETE FROM user_calendar_events WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM auth_tokens WHERE user_id = ?", userId);
        visitedFestivalRepository.deleteByUserEmail(email);
        userFollowRepository.deleteByFollowerEmail(email);
        userFollowRepository.deleteByFollowingEmail(email);
        userActivityRepository.deleteByUserId(userId);
        userPreferenceOptionRepository.deleteByUserId(userId);
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
