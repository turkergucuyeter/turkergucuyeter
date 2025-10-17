package com.example.restaurant.service;

import com.example.restaurant.dto.RestaurantSummaryDto;
import com.example.restaurant.model.Restaurant;

import java.util.List;

public interface RestaurantService {
    Restaurant create(Restaurant restaurant);

    Restaurant update(Long id, Restaurant restaurant);

    void delete(Long id);

    Restaurant get(Long id);

    List<RestaurantSummaryDto> list();
}
