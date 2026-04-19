package com.culture.wanderers.repository;

import com.culture.wanderers.entity.PartyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// public interface PartyMemberRepository extends JpaRepository<PartyMember, Long> {
//     List<PartyMember> findByUserEmail(String userEmail);
// }
public interface PartyMemberRepository extends JpaRepository<PartyMember, Long> {
    List<PartyMember> findByUserEmail(String userEmail);
    boolean existsByUserEmailAndParty_Id(String userEmail, Long partyId);

    void deleteByUserEmail(String userEmail);
    //void deleteByUserEmailAndParty_Id(String userEmail, Long partyId); 얘도.. 결정필요
   
}