package com.culture.wanderers.repository;

import com.culture.wanderers.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    List<User> findByEmailIn(Collection<String> emails);

    void deleteByEmail(String email);
}
