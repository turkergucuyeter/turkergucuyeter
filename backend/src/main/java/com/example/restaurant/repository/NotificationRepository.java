package com.example.restaurant.repository;

import com.example.restaurant.model.Notification;
import com.example.restaurant.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipient(UserAccount recipient);
}
