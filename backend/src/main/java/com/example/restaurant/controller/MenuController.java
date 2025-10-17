package com.example.restaurant.controller;

import com.example.restaurant.model.MenuCategory;
import com.example.restaurant.model.MenuItem;
import com.example.restaurant.service.MenuService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuCategory createCategory(@PathVariable Long restaurantId,
                                       @Validated @RequestBody MenuCategory category) {
        return menuService.createCategory(restaurantId, category);
    }

    @GetMapping("/categories")
    public List<MenuCategory> listCategories(@PathVariable Long restaurantId) {
        return menuService.getCategories(restaurantId);
    }

    @PostMapping("/categories/{categoryId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItem createItem(@PathVariable Long categoryId,
                               @Validated @RequestBody MenuItem item) {
        return menuService.createMenuItem(categoryId, item);
    }

    @GetMapping("/categories/{categoryId}/items")
    public List<MenuItem> listItems(@PathVariable Long categoryId) {
        return menuService.getItems(categoryId);
    }
}
