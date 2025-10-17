package com.example.restaurant.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderRequest(@NotNull Long restaurantId,
                           @NotNull Long tableId,
                           @NotNull Long customerId,
                           @Valid List<OrderItemRequest> items) {
}
