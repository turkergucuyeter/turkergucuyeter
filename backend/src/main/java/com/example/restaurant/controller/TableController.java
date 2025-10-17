package com.example.restaurant.controller;

import com.example.restaurant.model.DiningTable;
import com.example.restaurant.service.TableService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DiningTable createTable(@PathVariable Long restaurantId,
                                   @Validated @RequestBody DiningTable table) {
        return tableService.createTable(restaurantId, table);
    }

    @GetMapping
    public List<DiningTable> listTables(@PathVariable Long restaurantId) {
        return tableService.listTables(restaurantId);
    }
}
