package com.example.restaurant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotificationRequest(@NotNull Long recipientId,
                                  @NotBlank String channel,
                                  @NotBlank String message) {
}
