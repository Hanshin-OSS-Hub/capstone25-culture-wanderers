package com.culture.wanderers.repository;

import com.culture.wanderers.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByTypeOrderByCreatedAtDesc(String type);

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByUserEmailAndTypeOrderByCreatedAtDesc(String userEmail, String type);
}
