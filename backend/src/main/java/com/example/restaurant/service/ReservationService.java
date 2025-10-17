package com.example.restaurant.service;

import com.example.restaurant.dto.ReservationRequest;
import com.example.restaurant.model.Reservation;
import com.example.restaurant.model.ReservationStatus;

import java.time.LocalDate;
import java.util.List;

public interface ReservationService {
    Reservation createReservation(ReservationRequest request);

    Reservation updateStatus(Long id, ReservationStatus status);

    List<Reservation> findForRestaurantOnDate(Long restaurantId, LocalDate date);
}
