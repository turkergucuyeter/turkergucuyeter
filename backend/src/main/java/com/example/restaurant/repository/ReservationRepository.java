package com.example.restaurant.repository;

import com.example.restaurant.model.Reservation;
import com.example.restaurant.model.ReservationStatus;
import com.example.restaurant.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByRestaurantAndReservationTimeBetween(Restaurant restaurant,
                                                                 LocalDateTime start,
                                                                 LocalDateTime end);

    List<Reservation> findByStatus(ReservationStatus status);
}
