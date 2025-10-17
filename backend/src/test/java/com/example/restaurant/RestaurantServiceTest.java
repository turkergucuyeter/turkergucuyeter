package com.example.restaurant;

import com.example.restaurant.model.Restaurant;
import com.example.restaurant.service.RestaurantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class RestaurantServiceTest {

    @Autowired
    private RestaurantService restaurantService;

    @Test
    void createRestaurantPersistsEntity() {
        Restaurant restaurant = new Restaurant();
        restaurant.setName("Test Restaurant");
        restaurant.setDescription("Fine dining");
        restaurant.setAddress("123 Street");
        restaurant.setPhone("1234567890");

        Restaurant saved = restaurantService.create(restaurant);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Test Restaurant");
    }
}
