package com.example.restaurant.dto;

import java.time.LocalTime;

public record RestaurantSummaryDto(Long id,
                                   String name,
                                   String description,
                                   String address,
                                   String phone,
                                   LocalTime openingTime,
                                   LocalTime closingTime) {
}
