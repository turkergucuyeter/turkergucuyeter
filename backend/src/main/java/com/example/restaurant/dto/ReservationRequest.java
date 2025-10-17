package com.example.restaurant.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ReservationRequest(@NotNull Long restaurantId,
                                 @NotNull Long tableId,
                                 @NotNull Long customerId,
                                 @Future LocalDateTime reservationTime,
                                 @Min(1) int partySize,
                                 String notes) {
}
