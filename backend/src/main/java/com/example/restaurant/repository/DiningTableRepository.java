package com.example.restaurant.repository;

import com.example.restaurant.model.DiningTable;
import com.example.restaurant.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiningTableRepository extends JpaRepository<DiningTable, Long> {
    List<DiningTable> findByRestaurant(Restaurant restaurant);
}
