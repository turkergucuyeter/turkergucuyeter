package com.example.restaurant.repository;

import com.example.restaurant.model.MenuCategory;
import com.example.restaurant.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findByRestaurant(Restaurant restaurant);
}
