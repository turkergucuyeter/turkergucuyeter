package com.example.restaurant.controller;

import com.example.restaurant.dto.PaymentRequest;
import com.example.restaurant.model.Payment;
import com.example.restaurant.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Payment createPayment(@Validated @RequestBody PaymentRequest request) {
        return paymentService.recordPayment(request);
    }
}
