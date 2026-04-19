package com.culture.wanderers.repository;

import com.culture.wanderers.entity.Party;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartyRepository extends JpaRepository<Party, Long> {

    List<Party> findByAuthorEmail(String authorEmail);

    List<Party> findByFestivalId(Long festivalId);

    List<Party> findByFestivalIdAndStatus(Long festivalId, String status);

    List<Party> findByFestivalTitleAndStatus(String festivalTitle, String status);

    long countByFestivalId(Long festivalId);

    long countByFestivalIdAndStatus(Long festivalId, String status);
}