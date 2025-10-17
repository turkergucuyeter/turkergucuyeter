package com.example.restaurant.service.impl;

import com.example.restaurant.model.DiningTable;
import com.example.restaurant.model.Restaurant;
import com.example.restaurant.repository.DiningTableRepository;
import com.example.restaurant.repository.RestaurantRepository;
import com.example.restaurant.service.TableService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TableServiceImpl implements TableService {

    private final DiningTableRepository tableRepository;
    private final RestaurantRepository restaurantRepository;

    public TableServiceImpl(DiningTableRepository tableRepository,
                            RestaurantRepository restaurantRepository) {
        this.tableRepository = tableRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public DiningTable createTable(Long restaurantId, DiningTable table) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        table.setRestaurant(restaurant);
        return tableRepository.save(table);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiningTable> listTables(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        return tableRepository.findByRestaurant(restaurant);
    }
}
