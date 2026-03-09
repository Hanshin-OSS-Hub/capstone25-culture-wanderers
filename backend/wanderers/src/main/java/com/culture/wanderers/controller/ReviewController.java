// // package com.culture.wanderers.controller;

// // import com.culture.wanderers.entity.Review; 
// // import com.culture.wanderers.repository.ReviewRepository;
// // import org.springframework.web.bind.annotation.*; 
// // import java.util.List;

// // @RestController @CrossOrigin(origins = "*") public class ReviewController {
// //     private final ReviewRepository reviewRepository;

// // public ReviewController(ReviewRepository reviewRepository) { this.reviewRepository = reviewRepository; }

// // @GetMapping("/api/me/reviews") public List<Review> getMyReviews() { return reviewRepository.findAll(); }

// // @PostMapping("/api/reviews") public Review createReview(@RequestBody Review review) { review.setCreatedAt(java.time.LocalDate.now()); return reviewRepository.save(review); }

// // @GetMapping("/api/reviews/{id}") public Review getReview(@PathVariable Long id) { return reviewRepository.findById(id).orElse(null); }

// // @PatchMapping("/api/reviews/{id}") public Review updateReview(@PathVariable Long id, @RequestBody Review detail) { Review review = reviewRepository.findById(id).orElse(null); if (review != null) { review.setTitle(detail.getTitle()); review.setContent(detail.getContent()); review.setRating(detail.getRating()); return reviewRepository.save(review); } return null; }

// // @DeleteMapping("/api/reviews/{id}") public void deleteReview(@PathVariable Long id) { reviewRepository.deleteById(id); }
// // }
// package com.culture.wanderers.controller;

// import com.culture.wanderers.entity.Review;
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

//     public ReviewController(ReviewRepository reviewRepository) {
//         this.reviewRepository = reviewRepository;
//     }

//     // @GetMapping("/api/me/reviews")
//     // public List<Review> getMyReviews() {
//     //     // 아직 작성자 필드 없으니 전체 반환 (나중에 JWT 붙이면 변경)
//     //     return reviewRepository.findAll();
//     // }
//     @GetMapping("/api/me/reviews")
// public List<Review> getMyReviews(@RequestHeader(name="Authorization", required=false) String authHeader) {

//     if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//         throw new RuntimeException("토큰 없음");
//     }

//     String email = jwtUtil.extractEmail(authHeader.substring(7));
//     return reviewRepository.findByAuthorEmail(email);
// }

//     // @PostMapping("/api/reviews")
//     // public Review createReview(@RequestBody Review review) {
//     //     review.setCreatedAt(LocalDate.now());
//     //     return reviewRepository.save(review);
//     // }
//     @PostMapping("/api/reviews")
// public Review createReview(@RequestBody Review review,
//                            @RequestHeader(name="Authorization", required=false) String authHeader) {

//     if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//         throw new RuntimeException("토큰 없음");
//     }

//     String email = jwtUtil.extractEmail(authHeader.substring(7));

//     review.setAuthorEmail(email);
//     review.setCreatedAt(LocalDate.now());

//     return reviewRepository.save(review);
// }

//     @GetMapping("/api/reviews/{id}")
//     public Review getReview(@PathVariable Long id) {
//         return reviewRepository.findById(id)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));
//     }

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
import com.culture.wanderers.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final JwtUtil jwtUtil;

    public ReviewController(ReviewRepository reviewRepository, JwtUtil jwtUtil) {
        this.reviewRepository = reviewRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/api/me/reviews")
    public List<Review> getMyReviews(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);

        return reviewRepository.findByAuthorEmail(email);
    }

    @PostMapping("/api/reviews")
    public Review createReview(
            @RequestBody Review review,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);

        review.setAuthorEmail(email);
        review.setCreatedAt(LocalDate.now());

        return reviewRepository.save(review);
    }

    @GetMapping("/api/reviews/{id}")
    public Review getReview(@PathVariable Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));
    }

    @PatchMapping("/api/reviews/{id}")
    public Review updateReview(@PathVariable Long id, @RequestBody Review detail) {

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음"));

        review.setTitle(detail.getTitle());
        review.setContent(detail.getContent());
        review.setRating(detail.getRating());

        return reviewRepository.save(review);
    }

    @DeleteMapping("/api/reviews/{id}")
    public void deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "후기 없음");
        }
        reviewRepository.deleteById(id);
    }
}