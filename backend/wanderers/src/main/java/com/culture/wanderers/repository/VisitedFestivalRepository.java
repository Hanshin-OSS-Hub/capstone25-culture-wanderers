package com.culture.wanderers.repository;

import com.culture.wanderers.entity.VisitedFestival;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VisitedFestivalRepository extends JpaRepository<VisitedFestival, Long> {
    List<VisitedFestival> findByUserEmailOrderByVisitedAtDesc(String userEmail);

    Optional<VisitedFestival> findByUserEmailAndFestivalId(String userEmail, Long festivalId);

    boolean existsByUserEmailAndFestivalId(String userEmail, Long festivalId);

    void deleteByUserEmailAndFestivalId(String userEmail, Long festivalId);
}