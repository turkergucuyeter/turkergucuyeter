package com.example.restaurant.service.impl;

import com.example.restaurant.dto.OrderItemRequest;
import com.example.restaurant.dto.OrderRequest;
import com.example.restaurant.dto.OrderStatusUpdateRequest;
import com.example.restaurant.model.*;
import com.example.restaurant.repository.*;
import com.example.restaurant.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private final CustomerOrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final DiningTableRepository diningTableRepository;
    private final UserAccountRepository userAccountRepository;
    private final MenuItemRepository menuItemRepository;

    public OrderServiceImpl(CustomerOrderRepository orderRepository,
                            RestaurantRepository restaurantRepository,
                            DiningTableRepository diningTableRepository,
                            UserAccountRepository userAccountRepository,
                            MenuItemRepository menuItemRepository) {
        this.orderRepository = orderRepository;
        this.restaurantRepository = restaurantRepository;
        this.diningTableRepository = diningTableRepository;
        this.userAccountRepository = userAccountRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Override
    public CustomerOrder createOrder(OrderRequest request) {
        Restaurant restaurant = restaurantRepository.findById(request.restaurantId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        DiningTable table = diningTableRepository.findById(request.tableId())
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
        UserAccount customer = userAccountRepository.findById(request.customerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        CustomerOrder order = new CustomerOrder();
        order.setRestaurant(restaurant);
        order.setTableRef(table);
        order.setCustomer(customer);
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        Set<OrderItem> items = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.items()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.menuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));
            OrderItem item = new OrderItem();
            item.setMenuItem(menuItem);
            item.setQuantity(itemRequest.quantity());
            item.setPrice(menuItem.getPrice());
            item.setOrder(order);
            items.add(item);
            total = total.add(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity())));
        }
        order.setItems(items);
        order.setTotal(total);
        return orderRepository.save(order);
    }

    @Override
    public CustomerOrder updateOrderStatus(Long orderId, OrderStatusUpdateRequest request) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        order.setStatus(request.status());
        return orderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerOrder> findOrdersForRestaurant(Long restaurantId, LocalDate date) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return orderRepository.findByRestaurantAndCreatedAtBetween(restaurant, start, end);
    }
}
