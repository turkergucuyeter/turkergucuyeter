package com.example.restaurant.service.impl;

import com.example.restaurant.dto.PaymentRequest;
import com.example.restaurant.model.CustomerOrder;
import com.example.restaurant.model.Payment;
import com.example.restaurant.repository.CustomerOrderRepository;
import com.example.restaurant.repository.PaymentRepository;
import com.example.restaurant.service.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerOrderRepository orderRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              CustomerOrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public Payment recordPayment(PaymentRequest request) {
        CustomerOrder order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(request.amount());
        payment.setProvider(request.provider());
        payment.setCurrency(request.currency());
        payment.setPaidAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        order.setPayment(saved);
        return saved;
    }
}
