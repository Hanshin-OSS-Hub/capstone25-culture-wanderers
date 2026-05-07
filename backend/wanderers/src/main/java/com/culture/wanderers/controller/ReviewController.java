package com.culture.wanderers.controller;

import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.Party;
import com.culture.wanderers.entity.Review;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CommentRepository;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.PartyMemberRepository;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.repository.VisitedFestivalRepository;
import com.culture.wanderers.service.UserActivityService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final CommentRepository commentRepository;
    private final FestivalRepository festivalRepository;
    private final PartyRepository partyRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final UserRepository userRepository;
    private final VisitedFestivalRepository visitedFestivalRepository;
    private final JwtUtil jwtUtil;
    private final UserActivityService userActivityService;

    public ReviewController(
            ReviewRepository reviewRepository,
            CommentRepository commentRepository,
            FestivalRepository festivalRepository,
            PartyRepository partyRepository,
            PartyMemberRepository partyMemberRepository,
            UserRepository userRepository,
            VisitedFestivalRepository visitedFestivalRepository,
            JwtUtil jwtUtil,
            UserActivityService userActivityService
    ) {
        this.reviewRepository = reviewRepository;
        this.commentRepository = commentRepository;
        this.festivalRepository = festivalRepository;
        this.partyRepository = partyRepository;
        this.partyMemberRepository = partyMemberRepository;
        this.userRepository = userRepository;
        this.visitedFestivalRepository = visitedFestivalRepository;
        this.jwtUtil = jwtUtil;
        this.userActivityService = userActivityService;
    }

    @GetMapping("/api/reviews")
    public List<Review> getReviews() {
        List<Review> reviews = reviewRepository.findAllByOrderByCreatedAtDesc();
        reviews.forEach(this::prepareForResponse);
        return reviews;
    }

    @GetMapping("/api/me/reviews")
    public List<Review> getMyReviews(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);
        List<Review> reviews = reviewRepository.findByAuthorEmail(email);
        reviews.forEach(this::prepareForResponse);
        return reviews;
    }

    @PostMapping("/api/reviews")
    public Review createReview(
            @RequestBody Review review,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);
        normalizeReviewTarget(review);
        validateReviewContent(review);

        if ("festival".equalsIgnoreCase(review.getTargetType())) {
            Festival festival = validateFestivalReviewTarget(email, review.getTargetId());
            review.setTargetTitle(resolveFestivalReviewTitle(review.getTargetTitle(), festival));
        } else if ("party".equalsIgnoreCase(review.getTargetType())) {
            Party party = validatePartyReviewTarget(email, review.getTargetId());
            review.setTargetTitle(resolvePartyReviewTitle(review.getTargetTitle(), party));
            review.setIsAnonymous(false);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 리뷰 대상입니다.");
        }

        review.setAuthorEmail(email);
        review.setCreatedAt(LocalDate.now());
        if (review.getIsAnonymous() == null) {
            review.setIsAnonymous(false);
        }

        Review savedReview = reviewRepository.save(review);

        if ("festival".equalsIgnoreCase(savedReview.getTargetType())) {
            userActivityService.save(email, "review", savedReview.getTargetId(), null, null, savedReview.getTargetTitle());
        } else {
            Party party = partyRepository.findById(savedReview.getTargetId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티를 찾을 수 없습니다."));
            userActivityService.save(
                    email,
                    "review_party",
                    party.getFestivalId(),
                    party.getCategory(),
                    party.getLocation(),
                    savedReview.getTargetTitle()
            );
        }

        prepareForResponse(savedReview);
        return savedReview;
    }

    @GetMapping("/api/reviews/{id}")
    public Review getReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기를 찾을 수 없습니다."));
        prepareForResponse(review);
        return review;
    }

    @GetMapping("/api/reviews/average")
    public Double getAverageRating(
            @RequestParam String targetType,
            @RequestParam Long targetId
    ) {
        Double avg = reviewRepository.getAverageRating(targetType, targetId);
        return avg != null ? avg : 0.0;
    }

    @PatchMapping("/api/reviews/{id}")
    public Review updateReview(
            @PathVariable Long id,
            @RequestBody Review detail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기를 찾을 수 없습니다."));

        if (review.getAuthorEmail() == null || !review.getAuthorEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 후기만 수정할 수 있습니다.");
        }

        review.setTitle(detail.getTitle());
        review.setContent(detail.getContent());
        review.setRating(detail.getRating());
        validateReviewContent(review);

        Review savedReview = reviewRepository.save(review);
        prepareForResponse(savedReview);
        return savedReview;
    }

    @DeleteMapping("/api/reviews/{id}")
    public void deleteReview(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기를 찾을 수 없습니다."));

        if (review.getAuthorEmail() == null || !review.getAuthorEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 후기만 삭제할 수 있습니다.");
        }

        reviewRepository.deleteById(id);
    }

    @GetMapping("/api/users/{userEmail}/reviews")
    public List<Review> getUserReviews(@PathVariable String userEmail) {
        List<Review> reviews = reviewRepository.findByAuthorEmailOrderByCreatedAtDesc(userEmail);
        reviews.removeIf(review -> Boolean.TRUE.equals(review.getIsAnonymous()));
        reviews.forEach(this::prepareForResponse);
        return reviews;
    }

    private void normalizeReviewTarget(Review review) {
        if (review.getTargetType() == null || review.getTargetType().isBlank()) {
            review.setTargetType("festival");
        } else {
            review.setTargetType(review.getTargetType().trim().toLowerCase());
        }
    }

    private void validateReviewContent(Review review) {
        if (review.getTitle() == null || review.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "후기 제목을 입력해주세요.");
        }
        if (review.getContent() == null || review.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "후기 내용을 입력해주세요.");
        }
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "별점은 1점부터 5점까지 입력할 수 있습니다.");
        }
    }

    private Festival validateFestivalReviewTarget(String email, Long festivalId) {
        if (festivalId == null || festivalId <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "후기 대상 행사를 찾을 수 없습니다.");
        }

        Festival festival = festivalRepository.findById(festivalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다."));

        if (!visitedFestivalRepository.existsByUserEmailAndFestivalId(email, festivalId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "다녀왔어요로 방문 인증한 행사만 리뷰를 작성할 수 있습니다."
            );
        }

        return festival;
    }

    private Party validatePartyReviewTarget(String email, Long partyId) {
        if (partyId == null || partyId <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "후기 대상 파티를 찾을 수 없습니다.");
        }

        Party party = partyRepository.findById(partyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티를 찾을 수 없습니다."));

        boolean isHost = party.getAuthorEmail() != null && party.getAuthorEmail().equalsIgnoreCase(email);
        boolean isApprovedMember = partyMemberRepository.existsByUserEmailAndParty_IdAndStatus(email, partyId, "APPROVED");

        if (!"COMPLETED".equalsIgnoreCase(party.getStatus()) && !isReviewablePastMeeting(party, partyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "완료된 파티나 모임 시간이 지난 파티만 후기를 작성할 수 있습니다.");
        }

        if (!isHost && !isApprovedMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "참여가 확인된 파티만 후기를 작성할 수 있습니다.");
        }

        return party;
    }

    private boolean isReviewablePastMeeting(Party party, Long partyId) {
        LocalDateTime meetingTime = party.getMeetingTime();
        if (meetingTime == null || meetingTime.isAfter(LocalDateTime.now())) {
            return false;
        }

        return partyMemberRepository.findByParty_IdOrderByCreatedAtAsc(partyId)
                .stream()
                .anyMatch(member -> "APPROVED".equalsIgnoreCase(member.getStatus()));
    }

    private String extractEmailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        try {
            String token = authHeader.substring(7);
            return jwtUtil.extractEmail(token);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰이 유효하지 않거나 만료되었습니다.");
        }
    }

    private void prepareForResponse(Review review) {
        attachCommentCount(review);
        setAuthorNickname(review);
        attachAuthorTrustBadges(review);
        maskAnonymousUser(review);
    }

    private void attachCommentCount(Review review) {
        if (review == null || review.getId() == null) {
            return;
        }
        long count = commentRepository.countByTargetTypeAndTargetId("REVIEW", review.getId());
        review.setCommentCount(count);
    }

    private void setAuthorNickname(Review review) {
        if (review == null) {
            return;
        }
        if (Boolean.TRUE.equals(review.getIsAnonymous())) {
            review.setAuthorNickname("익명");
        } else if (review.getAuthorNickname() == null || review.getAuthorNickname().isBlank()) {
            User user = userRepository.findByEmail(review.getAuthorEmail()).orElse(null);
            review.setAuthorNickname(user != null ? user.getNickname() : "작성자");
        }
    }

    private void maskAnonymousUser(Review review) {
        if (review == null) {
            return;
        }
        if (Boolean.TRUE.equals(review.getIsAnonymous())) {
            review.setAuthorEmail(null);
        }
    }

    private void attachAuthorTrustBadges(Review review) {
        if (review == null || review.getAuthorEmail() == null || Boolean.TRUE.equals(review.getIsAnonymous())) {
            return;
        }

        List<Review> authorReviews = reviewRepository.findByAuthorEmail(review.getAuthorEmail());
        List<Review> festivalReviews = authorReviews.stream()
                .filter(item -> "festival".equalsIgnoreCase(item.getTargetType()))
                .toList();
        List<Review> partyReviews = authorReviews.stream()
                .filter(item -> "party".equalsIgnoreCase(item.getTargetType()))
                .toList();

        long verifiedReviewCount = festivalReviews.size();
        long partyReviewCount = partyReviews.size();
        double ratingDeviation = calculateRatingDeviation(festivalReviews);

        List<String> badges = new ArrayList<>();
        if (verifiedReviewCount >= 1) {
            badges.add("첫 방문 리뷰어");
        }
        if (verifiedReviewCount >= 5) {
            badges.add("문화 기록가");
        }
        if (verifiedReviewCount >= 10 && ratingDeviation <= 1.0) {
            badges.add("믿음 리뷰어");
        }
        if (partyReviewCount >= 3) {
            badges.add("동행 검증됨");
        }
        if (verifiedReviewCount + partyReviewCount >= 15) {
            badges.add("문화 마스터");
        }

        int trustScore = 40
                + (int) Math.min(30, verifiedReviewCount * 3)
                + (int) Math.min(18, partyReviewCount * 4)
                + (ratingDeviation <= 1.0 && verifiedReviewCount >= 3 ? 7 : 0)
                + (verifiedReviewCount + partyReviewCount >= 15 ? 5 : 0);

        review.setAuthorTrustBadges(badges);
        review.setAuthorTrustScore(Math.min(100, trustScore));
        review.setAuthorVerifiedReviewCount(verifiedReviewCount);
        review.setAuthorPartyReviewCount(partyReviewCount);
    }

    private double calculateRatingDeviation(List<Review> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return 5.0;
        }

        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        double variance = reviews.stream()
                .mapToDouble(review -> Math.pow(review.getRating() - average, 2))
                .average()
                .orElse(0.0);

        return Math.sqrt(variance);
    }

    private String resolveFestivalReviewTitle(String targetTitle, Festival festival) {
        if (targetTitle != null && !targetTitle.isBlank()) {
            return targetTitle;
        }
        return festival.getTitle() != null && !festival.getTitle().isBlank() ? festival.getTitle() : "문화행사";
    }

    private String resolvePartyReviewTitle(String targetTitle, Party party) {
        if (targetTitle != null && !targetTitle.isBlank()) {
            return targetTitle;
        }
        return party.getTitle() != null && !party.getTitle().isBlank() ? party.getTitle() : "파티";
    }
}
