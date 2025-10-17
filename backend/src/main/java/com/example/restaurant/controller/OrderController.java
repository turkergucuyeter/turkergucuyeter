package com.example.restaurant.controller;

import com.example.restaurant.dto.OrderRequest;
import com.example.restaurant.dto.OrderStatusUpdateRequest;
import com.example.restaurant.model.CustomerOrder;
import com.example.restaurant.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerOrder createOrder(@Validated @RequestBody OrderRequest request) {
        return orderService.createOrder(request);
    }

    @PatchMapping("/{id}/status")
    public CustomerOrder updateStatus(@PathVariable Long id,
                                      @Validated @RequestBody OrderStatusUpdateRequest request) {
        return orderService.updateOrderStatus(id, request);
    }

    @GetMapping
    public List<CustomerOrder> listOrders(@RequestParam Long restaurantId,
                                          @RequestParam LocalDate date) {
        return orderService.findOrdersForRestaurant(restaurantId, date);
    }
}
