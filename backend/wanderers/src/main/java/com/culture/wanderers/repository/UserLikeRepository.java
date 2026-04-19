package com.culture.wanderers.repository;

import com.culture.wanderers.entity.UserLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserLikeRepository extends JpaRepository<UserLike, Long> {

    List<UserLike> findByUserEmail(String userEmail);

    List<UserLike> findByUserEmailAndTargetType(String userEmail, String targetType);

    Optional<UserLike> findByUserEmailAndTargetTypeAndTargetId(String userEmail, String targetType, Long targetId);

    boolean existsByUserEmailAndTargetTypeAndTargetId(String userEmail, String targetType, Long targetId);

    void deleteByUserEmail(String userEmail);

    //void deleteByUserEmailAndTargetTypeAndTargetId(String userEmail, String targetType, Long targetId);
    //위에것도 유저이메일이랑 타겟타입 아이디 둘 다 삭제? 아니면 추천부분만 삭제?
}