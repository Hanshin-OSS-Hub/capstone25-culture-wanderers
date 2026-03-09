package com.culture.wanderers.repository;

import com.culture.wanderers.entity.Party;

import org.springframework.data.jpa.repository.JpaRepository;

// public interface PartyRepository extends JpaRepository<Party, Long> {

// }
import java.util.List;

public interface PartyRepository extends JpaRepository<Party, Long> {
    List<Party> findByAuthorEmail(String authorEmail);
}