package com.example.restaurant.repository;

import com.example.restaurant.model.CustomerOrder;
import com.example.restaurant.model.OrderStatus;
import com.example.restaurant.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByRestaurantAndCreatedAtBetween(Restaurant restaurant,
                                                            LocalDateTime start,
                                                            LocalDateTime end);

    List<CustomerOrder> findByStatus(OrderStatus status);
}
