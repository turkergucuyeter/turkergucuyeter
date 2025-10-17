package com.example.restaurant.controller;

import com.example.restaurant.dto.ReservationRequest;
import com.example.restaurant.model.Reservation;
import com.example.restaurant.model.ReservationStatus;
import com.example.restaurant.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Reservation createReservation(@Validated @RequestBody ReservationRequest request) {
        return reservationService.createReservation(request);
    }

    @PatchMapping("/{id}/status")
    public Reservation updateStatus(@PathVariable Long id,
                                    @RequestParam ReservationStatus status) {
        return reservationService.updateStatus(id, status);
    }

    @GetMapping
    public List<Reservation> getReservations(@RequestParam Long restaurantId,
                                             @RequestParam LocalDate date) {
        return reservationService.findForRestaurantOnDate(restaurantId, date);
    }
}
