package com.culture.wanderers.repository;

import com.culture.wanderers.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTargetTypeAndTargetIdOrderByCreatedAtAsc(String targetType, Long targetId);

    long countByTargetTypeAndTargetId(String targetType, Long targetId);
}
