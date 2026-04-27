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
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CommentRepository;
import com.culture.wanderers.repository.ReviewRepository;
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
    private final JwtUtil jwtUtil;
    private final UserActivityService userActivityService;

    public ReviewController(
            ReviewRepository reviewRepository,
            CommentRepository commentRepository,
            JwtUtil jwtUtil,
            UserActivityService userActivityService
    ) {
        this.reviewRepository = reviewRepository;
        this.commentRepository = commentRepository;
        this.jwtUtil = jwtUtil;
        this.userActivityService = userActivityService;
    }

    @GetMapping("/api/reviews")
    public List<Review> getReviews() {
        List<Review> reviews = reviewRepository.findAllByOrderByCreatedAtDesc();
        reviews.forEach(this::attachCommentCount);
        return reviews;
    }

    @GetMapping("/api/me/reviews")
    public List<Review> getMyReviews(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);
        List<Review> reviews = reviewRepository.findByAuthorEmail(email);
        reviews.forEach(this::attachCommentCount);
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

        review.setAuthorEmail(email);
        review.setCreatedAt(LocalDate.now());

        Review savedReview = reviewRepository.save(review);

        if ("festival".equalsIgnoreCase(savedReview.getTargetType())) {
            userActivityService.save(email, "review", savedReview.getTargetId(), null, null, savedReview.getTargetTitle());
        }

        return savedReview;
    }

    @GetMapping("/api/reviews/{id}")
    public Review getReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));
        attachCommentCount(review);
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
}
