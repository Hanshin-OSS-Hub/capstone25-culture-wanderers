package com.culture.wanderers.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.culture.wanderers.entity.UserActivity;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    List<UserActivity> findByUserId(Long userId);

    List<UserActivity> findByUserIdOrderByCreatedAtDesc(Long userId);
}
