package com.example.restaurant.controller;

import com.example.restaurant.model.UserAccount;
import com.example.restaurant.model.UserRole;
import com.example.restaurant.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserAccount createUser(@Validated @RequestBody UserAccount user) {
        return userService.createUser(user);
    }

    @GetMapping
    public List<UserAccount> listByRole(@RequestParam(required = false) UserRole role) {
        if (role == null) {
            return userService.findByRole(UserRole.CUSTOMER);
        }
        return userService.findByRole(role);
    }
}
