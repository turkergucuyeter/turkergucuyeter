package com.example.restaurant.service.impl;

import com.example.restaurant.model.MenuCategory;
import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.Restaurant;
import com.example.restaurant.repository.MenuCategoryRepository;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.repository.RestaurantRepository;
import com.example.restaurant.service.MenuService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MenuServiceImpl implements MenuService {

    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final RestaurantRepository restaurantRepository;

    public MenuServiceImpl(MenuCategoryRepository categoryRepository,
                           MenuItemRepository itemRepository,
                           RestaurantRepository restaurantRepository) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public MenuCategory createCategory(Long restaurantId, MenuCategory category) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        category.setRestaurant(restaurant);
        return categoryRepository.save(category);
    }

    @Override
    public MenuItem createMenuItem(Long categoryId, MenuItem item) {
        MenuCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        item.setCategory(category);
        return itemRepository.save(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuCategory> getCategories(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        return categoryRepository.findByRestaurant(restaurant);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItem> getItems(Long categoryId) {
        MenuCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        return itemRepository.findByCategory(category);
    }
}
