// package com.culture.wanderers.repository;

// import com.culture.wanderers.entity.Review;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;   

// import java.util.List;

// public interface ReviewRepository extends JpaRepository<Review, Long> {

//     List<Review> findByAuthorEmail(String authorEmail);

//     // 특정 공연/전시/파티의 후기 조회
//     List<Review> findByTargetTypeAndTargetId(String targetType, Long targetId);
//     @Query("SELECT AVG(r.rating) FROM Review r WHERE r.targetType = :targetType AND r.targetId = :targetId")
//     Double getAverageRating(String targetType, Long targetId);
// }
package com.culture.wanderers.repository;

import com.culture.wanderers.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByAuthorEmail(String authorEmail);

    List<Review> findAllByOrderByCreatedAtDesc();

    List<Review> findByTargetTypeAndTargetId(String targetType, Long targetId);

    long countByTargetTypeAndTargetId(String targetType, Long targetId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.targetType = :targetType AND r.targetId = :targetId")
    Double getAverageRating(String targetType, Long targetId);

    void deleteByIdAndAuthorEmail(Long id, String authorEmail);
}
