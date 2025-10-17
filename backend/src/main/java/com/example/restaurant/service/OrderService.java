package com.example.restaurant.service;

import com.example.restaurant.dto.OrderRequest;
import com.example.restaurant.dto.OrderStatusUpdateRequest;
import com.example.restaurant.model.CustomerOrder;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {
    CustomerOrder createOrder(OrderRequest request);

    CustomerOrder updateOrderStatus(Long orderId, OrderStatusUpdateRequest request);

    List<CustomerOrder> findOrdersForRestaurant(Long restaurantId, LocalDate date);
}
