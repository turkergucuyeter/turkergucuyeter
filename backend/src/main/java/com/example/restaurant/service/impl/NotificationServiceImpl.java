package com.example.restaurant.service.impl;

import com.example.restaurant.dto.NotificationRequest;
import com.example.restaurant.model.Notification;
import com.example.restaurant.model.UserAccount;
import com.example.restaurant.repository.NotificationRepository;
import com.example.restaurant.repository.UserAccountRepository;
import com.example.restaurant.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserAccountRepository userAccountRepository) {
        this.notificationRepository = notificationRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    public Notification sendNotification(NotificationRequest request) {
        UserAccount user = userAccountRepository.findById(request.recipientId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Notification notification = new Notification();
        notification.setRecipient(user);
        notification.setChannel(request.channel());
        notification.setMessage(request.message());
        notification.setDelivered(false);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForUser(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByRecipient(user);
    }
}
