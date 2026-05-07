package com.culture.wanderers.repository;

import com.culture.wanderers.entity.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    List<UserFollow> findByFollowerEmail(String followerEmail);

    List<UserFollow> findByFollowingEmail(String followingEmail);

    Optional<UserFollow> findByFollowerEmailAndFollowingEmail(String followerEmail, String followingEmail);

    boolean existsByFollowerEmailAndFollowingEmail(String followerEmail, String followingEmail);

    long countByFollowerEmail(String followerEmail);

    long countByFollowingEmail(String followingEmail);

    void deleteByFollowerEmail(String followerEmail);

    void deleteByFollowingEmail(String followingEmail);
}
