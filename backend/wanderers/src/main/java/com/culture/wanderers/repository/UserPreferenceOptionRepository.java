package com.culture.wanderers.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.culture.wanderers.entity.UserPreferenceOption;

public interface UserPreferenceOptionRepository extends JpaRepository<UserPreferenceOption, Long> {

    List<UserPreferenceOption> findByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByUserIdAndPreferenceType(Long userId, String preferenceType);
}
