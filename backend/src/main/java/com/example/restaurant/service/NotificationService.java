package com.example.restaurant.service;

import com.example.restaurant.dto.NotificationRequest;
import com.example.restaurant.model.Notification;

import java.util.List;

public interface NotificationService {
    Notification sendNotification(NotificationRequest request);

    List<Notification> getNotificationsForUser(Long userId);
}
