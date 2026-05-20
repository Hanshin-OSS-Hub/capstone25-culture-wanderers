package com.culture.wanderers.repository;

import com.culture.wanderers.entity.PartyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PartyMemberRepository extends JpaRepository<PartyMember, Long> {
    List<PartyMember> findByUserEmail(String userEmail);
    boolean existsByUserEmailAndParty_Id(String userEmail, Long partyId);
    List<PartyMember> findByParty_IdOrderByCreatedAtAsc(Long partyId);
    List<PartyMember> findByUserEmailAndStatus(String userEmail, String status);
    @Query("select pm from PartyMember pm join fetch pm.party where pm.userEmail = :userEmail and upper(pm.status) = upper(:status)")
    List<PartyMember> findLinkedByUserEmailAndStatus(@Param("userEmail") String userEmail, @Param("status") String status);
    boolean existsByUserEmailAndParty_IdAndStatus(String userEmail, Long partyId, String status);

    void deleteByUserEmail(String userEmail);
    void deleteByParty_Id(Long partyId);
}
