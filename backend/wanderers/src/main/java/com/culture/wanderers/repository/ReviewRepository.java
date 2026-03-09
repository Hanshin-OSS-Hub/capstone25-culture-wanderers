package com.culture.wanderers.repository;

import com.culture.wanderers.entity.Review; 
import org.springframework.data.jpa.repository.JpaRepository; 
// import org.springframework.stereotype.Repository; 
import java.util.List;

// @Repository public interface ReviewRepository extends JpaRepository<Review, Long> { 
//     // 특정 사용자의 후기만 모아서 가져오는 기능 List<Review> findByTargetId(Long targetId); 
//     List<Review> findByTargetType(String targetType);
//     } 

   

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByAuthorEmail(String authorEmail);

    // (옵션) 축제/파티별 후기 모아보기
    List<Review> findByTargetTypeAndTargetId(String targetType, Long targetId);
}
