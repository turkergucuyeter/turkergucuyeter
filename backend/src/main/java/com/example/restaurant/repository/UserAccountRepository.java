package com.example.restaurant.repository;

import com.example.restaurant.model.UserAccount;
import com.example.restaurant.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmail(String email);
    List<UserAccount> findByRole(UserRole role);
}
