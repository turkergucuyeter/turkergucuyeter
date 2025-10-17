package com.example.restaurant.service;

import com.example.restaurant.model.DiningTable;

import java.util.List;

public interface TableService {
    DiningTable createTable(Long restaurantId, DiningTable table);

    List<DiningTable> listTables(Long restaurantId);
}
