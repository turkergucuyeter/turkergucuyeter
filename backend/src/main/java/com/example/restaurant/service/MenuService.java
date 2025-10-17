package com.example.restaurant.service;

import com.example.restaurant.model.MenuCategory;
import com.example.restaurant.model.MenuItem;

import java.util.List;

public interface MenuService {
    MenuCategory createCategory(Long restaurantId, MenuCategory category);

    MenuItem createMenuItem(Long categoryId, MenuItem item);

    List<MenuCategory> getCategories(Long restaurantId);

    List<MenuItem> getItems(Long categoryId);
}
