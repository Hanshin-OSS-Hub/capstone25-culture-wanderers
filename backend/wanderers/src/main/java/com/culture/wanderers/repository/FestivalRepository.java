package com.culture.wanderers.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.culture.wanderers.entity.Festival;

public interface FestivalRepository extends JpaRepository<Festival, Long>, JpaSpecificationExecutor<Festival> {
    List<Festival> findByRegionContainingIgnoreCase(String region);
    List<Festival> findByCategoryContainingIgnoreCase(String category);
}