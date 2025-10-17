package com.example.restaurant.service;

import com.example.restaurant.model.UserAccount;
import com.example.restaurant.model.UserRole;

import java.util.List;

public interface UserService {
    UserAccount createUser(UserAccount user);

    List<UserAccount> findByRole(UserRole role);
}
