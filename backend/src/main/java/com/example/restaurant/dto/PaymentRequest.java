package com.example.restaurant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PaymentRequest(@NotNull Long orderId,
                             @NotNull BigDecimal amount,
                             @NotBlank String provider,
                             @NotBlank String currency) {
}
