package com.example.restaurant.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(@NotNull Long menuItemId,
                               @Min(1) int quantity) {
}
