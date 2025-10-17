package com.example.restaurant.service;

import com.example.restaurant.dto.PaymentRequest;
import com.example.restaurant.model.Payment;

public interface PaymentService {
    Payment recordPayment(PaymentRequest request);
}
