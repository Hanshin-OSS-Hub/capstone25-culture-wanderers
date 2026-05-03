// package com.culture.wanderers.controller;

// import com.culture.wanderers.entity.Review;
// import com.culture.wanderers.jwt.JwtUtil;
// import com.culture.wanderers.repository.ReviewRepository;
// import org.springframework.http.HttpStatus;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.server.ResponseStatusException;

// import java.time.LocalDate;
// import java.util.List;

// @RestController
// @CrossOrigin(origins = "*")
// public class ReviewController {

//     private final ReviewRepository reviewRepository;
//     private final JwtUtil jwtUtil;

//     public ReviewController(ReviewRepository reviewRepository, JwtUtil jwtUtil) {
//         this.reviewRepository = reviewRepository;
//         this.jwtUtil = jwtUtil;
//     }

//     @GetMapping("/api/me/reviews")
//     public List<Review> getMyReviews(
//             @RequestHeader(name = "Authorization", required = false) String authHeader
//     ) {
//         if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//             throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
//         }

//         String token = authHeader.substring(7);
//         String email = jwtUtil.extractEmail(token);

//         return reviewRepository.findByAuthorEmail(email);
//     }

//     @PostMapping("/api/reviews")
//     public Review createReview(
//             @RequestBody Review review,
//             @RequestHeader(name = "Authorization", required = false) String authHeader
//     ) {
//         if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//             throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
//         }

//         String token = authHeader.substring(7);
//         String email = jwtUtil.extractEmail(token);

//         review.setAuthorEmail(email);
//         review.setCreatedAt(LocalDate.now());

//         return reviewRepository.save(review);
//     }

//     @GetMapping("/api/reviews/{id}")
//     public Review getReview(@PathVariable Long id) {
//         return reviewRepository.findById(id)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));
//     }

//     @GetMapping("/api/reviews/average")
// public Double getAverageRating(
//         @RequestParam String targetType,
//         @RequestParam Long targetId
// ) {
//     Double avg = reviewRepository.getAverageRating(targetType, targetId);
//     return avg != null ? avg : 0.0;
// }

//     @PatchMapping("/api/reviews/{id}")
//     public Review updateReview(@PathVariable Long id, @RequestBody Review detail) {

//         Review review = reviewRepository.findById(id)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));

//         review.setTitle(detail.getTitle());
//         review.setContent(detail.getContent());
//         review.setRating(detail.getRating());

//         return reviewRepository.save(review);
//     }

//     @DeleteMapping("/api/reviews/{id}")
//     public void deleteReview(@PathVariable Long id) {
//         if (!reviewRepository.existsById(id)) {
//             throw new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음");
//         }
//         reviewRepository.deleteById(id);
//     }
// }
package com.culture.wanderers.controller;

import com.culture.wanderers.entity.Review;
import com.culture.wanderers.entity.Party;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.repository.PartyMemberRepository;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CommentRepository;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.service.UserActivityService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final CommentRepository commentRepository;
    private final PartyRepository partyRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final UserActivityService userActivityService;

    public ReviewController(
            ReviewRepository reviewRepository,
            CommentRepository commentRepository,
            PartyRepository partyRepository,
            PartyMemberRepository partyMemberRepository,
            UserRepository userRepository,
            JwtUtil jwtUtil,
            UserActivityService userActivityService
    ) {
        this.reviewRepository = reviewRepository;
        this.commentRepository = commentRepository;
        this.partyRepository = partyRepository;
        this.partyMemberRepository = partyMemberRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.userActivityService = userActivityService;
    }
    

    @GetMapping("/api/reviews")
    public List<Review> getReviews() {
        List<Review> reviews = reviewRepository.findAllByOrderByCreatedAtDesc();
        reviews.forEach(review -> {
            attachCommentCount(review);
            setAuthorNickname(review);
            maskAnonymousUser(review);
        });
        return reviews;
    }

    @GetMapping("/api/me/reviews")
    public List<Review> getMyReviews(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);
        List<Review> reviews = reviewRepository.findByAuthorEmail(email);
        reviews.forEach(review -> {
            attachCommentCount(review);
            setAuthorNickname(review);
            maskAnonymousUser(review);
        });
        return reviews;
    }

    @PostMapping("/api/reviews")
    public Review createReview(
            @RequestBody Review review,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        if (review.getTargetId() == null) {
            review.setTargetId(0L);
        }
        if (review.getTargetType() == null || review.getTargetType().isBlank()) {
            review.setTargetType("festival");
        }

        if ("party".equalsIgnoreCase(review.getTargetType())) {
            Party party = validatePartyReviewTarget(email, review.getTargetId());
            review.setTargetTitle(resolvePartyReviewTitle(review.getTargetTitle(), party));
        }

        review.setAuthorEmail(email);
        review.setCreatedAt(LocalDate.now());

        // 익명 여부 설정
        // 파티 후기는 익명 불가
        if ("party".equalsIgnoreCase(review.getTargetType())) {
            review.setIsAnonymous(false);
        } else if (review.getIsAnonymous() == null) {
            review.setIsAnonymous(false);
        }

        Review savedReview = reviewRepository.save(review);

        if ("festival".equalsIgnoreCase(savedReview.getTargetType())) {
            userActivityService.save(email, "review", savedReview.getTargetId(), null, null, savedReview.getTargetTitle());
        } else if ("party".equalsIgnoreCase(savedReview.getTargetType())) {
            Party party = partyRepository.findById(savedReview.getTargetId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티 없음"));
            userActivityService.save(
                    email,
                    "review_party",
                    party.getFestivalId(),
                    party.getCategory(),
                    party.getLocation(),
                    savedReview.getTargetTitle()
            );
        }

        setAuthorNickname(savedReview);
        maskAnonymousUser(savedReview);
        return savedReview;
    }

    @GetMapping("/api/reviews/{id}")
    public Review getReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));
        attachCommentCount(review);
        setAuthorNickname(review);
        maskAnonymousUser(review);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));

        if (review.getAuthorEmail() == null || !review.getAuthorEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 후기만 수정 가능");
        }

        review.setTitle(detail.getTitle());
        review.setContent(detail.getContent());
        review.setRating(detail.getRating());

        return reviewRepository.save(review);
    }

    @DeleteMapping("/api/reviews/{id}")
    public void deleteReview(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));

        if (review.getAuthorEmail() == null || !review.getAuthorEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 후기만 삭제 가능");
        }

        reviewRepository.deleteById(id);
    }

    @GetMapping("/api/users/{userEmail}/reviews")
    public List<Review> getUserReviews(@PathVariable String userEmail) {
        List<Review> reviews = reviewRepository.findByAuthorEmailOrderByCreatedAtDesc(userEmail);
        // 유저 페이지에서는 익명으로 작성된 후기는 표시하지 않음
        reviews.removeIf(review -> review.getIsAnonymous() != null && review.getIsAnonymous());

        reviews.forEach(review -> {
            attachCommentCount(review);
            setAuthorNickname(review);
            maskAnonymousUser(review);
        });

        return reviews;
    }

    private String extractEmailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        try {
            String token = authHeader.substring(7);
            return jwtUtil.extractEmail(token);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류/만료");
        }
    }

    private void attachCommentCount(Review review) {
        if (review == null || review.getId() == null) {
            return;
        }
        long count = commentRepository.countByTargetTypeAndTargetId("REVIEW", review.getId());
        review.setCommentCount(count);
    }

    private Party validatePartyReviewTarget(String email, Long partyId) {
        if (partyId == null || partyId <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파티 후기 대상이 없습니다.");
        }

        Party party = partyRepository.findById(partyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티 없음"));

            boolean isHost = party.getAuthorEmail() != null && party.getAuthorEmail().equalsIgnoreCase(email);
            boolean isApprovedMember = partyMemberRepository.existsByUserEmailAndParty_IdAndStatus(email, partyId, "APPROVED");

            // Allow reviews when party status is COMPLETED, or when meeting time has passed and there is at least one approved member
            if (!"COMPLETED".equalsIgnoreCase(party.getStatus())) {
                // check meeting time passed and approved members exist
                boolean meetingPassedAndHasApproved = false;
                if (party.getMeetingTime() != null) {
                    try {
                        java.time.LocalDateTime mt = party.getMeetingTime();
                        if (!mt.isAfter(java.time.LocalDateTime.now())) {
                            long approvedCount = partyMemberRepository.findByParty_IdOrderByCreatedAtAsc(partyId)
                                    .stream().filter(pm -> "APPROVED".equalsIgnoreCase(pm.getStatus())).count();
                            meetingPassedAndHasApproved = approvedCount > 0;
                        }
                    } catch (Exception ignored) {
                        meetingPassedAndHasApproved = false;
                    }
                }

                if (!meetingPassedAndHasApproved) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "완료된 파티에만 후기를 남길 수 있습니다.");
                }
            }

            if (!isHost && !isApprovedMember) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "참여가 확인된 파티만 후기 작성이 가능합니다.");
            }

        return party;
    }

    private void setAuthorNickname(Review review) {
        if (review == null) {
            return;
        }
        if (review.getIsAnonymous() != null && review.getIsAnonymous()) {
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
        if (review.getIsAnonymous() != null && review.getIsAnonymous()) {
            review.setAuthorEmail(null);
        }
    }

    private String resolvePartyReviewTitle(String targetTitle, Party party) {
        if (targetTitle != null && !targetTitle.isBlank()) {
            return targetTitle;
        }

        if (party == null) {
            return "파티";
        }

        return party.getTitle() != null && !party.getTitle().isBlank() ? party.getTitle() : "파티";
    }
}
