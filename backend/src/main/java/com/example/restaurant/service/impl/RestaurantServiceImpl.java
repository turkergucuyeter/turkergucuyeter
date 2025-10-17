package com.example.restaurant.service.impl;

import com.example.restaurant.dto.RestaurantSummaryDto;
import com.example.restaurant.model.Restaurant;
import com.example.restaurant.repository.RestaurantRepository;
import com.example.restaurant.service.RestaurantService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantServiceImpl(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public Restaurant create(Restaurant restaurant) {
        return restaurantRepository.save(restaurant);
    }

    @Override
    public Restaurant update(Long id, Restaurant restaurant) {
        Restaurant existing = get(id);
        existing.setName(restaurant.getName());
        existing.setDescription(restaurant.getDescription());
        existing.setAddress(restaurant.getAddress());
        existing.setPhone(restaurant.getPhone());
        existing.setOpeningTime(restaurant.getOpeningTime());
        existing.setClosingTime(restaurant.getClosingTime());
        return restaurantRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        restaurantRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Restaurant get(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantSummaryDto> list() {
        return restaurantRepository.findAll().stream()
                .map(r -> new RestaurantSummaryDto(r.getId(), r.getName(), r.getDescription(),
                        r.getAddress(), r.getPhone(), r.getOpeningTime(), r.getClosingTime()))
                .toList();
    }
}
