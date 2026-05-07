package com.culture.wanderers.repository;

import com.culture.wanderers.entity.UserSave;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSaveRepository extends JpaRepository<UserSave, Long> {

    List<UserSave> findByUserEmail(String userEmail);

    List<UserSave> findByUserEmailAndTargetType(String userEmail, String targetType);

    List<UserSave> findByUserEmailInAndTargetType(List<String> userEmails, String targetType);

    Optional<UserSave> findByUserEmailAndTargetTypeAndTargetId(String userEmail, String targetType, Long targetId);

    boolean existsByUserEmailAndTargetTypeAndTargetId(String userEmail, String targetType, Long targetId);

    long countByTargetTypeIgnoreCaseAndTargetId(String targetType, Long targetId);

    void deleteByUserEmail(String userEmail);
}
