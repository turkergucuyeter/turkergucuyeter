package com.example.restaurant.service.impl;

import com.example.restaurant.model.UserAccount;
import com.example.restaurant.model.UserRole;
import com.example.restaurant.repository.UserAccountRepository;
import com.example.restaurant.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserAccountRepository userAccountRepository;

    public UserServiceImpl(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    public UserAccount createUser(UserAccount user) {
        return userAccountRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserAccount> findByRole(UserRole role) {
        return userAccountRepository.findByRole(role);
    }
}
