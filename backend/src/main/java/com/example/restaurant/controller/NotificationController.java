package com.example.restaurant.controller;

import com.example.restaurant.dto.NotificationRequest;
import com.example.restaurant.model.Notification;
import com.example.restaurant.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Notification sendNotification(@Validated @RequestBody NotificationRequest request) {
        return notificationService.sendNotification(request);
    }

    @GetMapping
    public List<Notification> getNotifications(@RequestParam Long userId) {
        return notificationService.getNotificationsForUser(userId);
    }
}
