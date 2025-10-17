package com.example.restaurant.service.impl;

import com.example.restaurant.dto.ReservationRequest;
import com.example.restaurant.model.*;
import com.example.restaurant.repository.*;
import com.example.restaurant.service.ReservationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantRepository restaurantRepository;
    private final DiningTableRepository diningTableRepository;
    private final UserAccountRepository userAccountRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository,
                                  RestaurantRepository restaurantRepository,
                                  DiningTableRepository diningTableRepository,
                                  UserAccountRepository userAccountRepository) {
        this.reservationRepository = reservationRepository;
        this.restaurantRepository = restaurantRepository;
        this.diningTableRepository = diningTableRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    public Reservation createReservation(ReservationRequest request) {
        Restaurant restaurant = restaurantRepository.findById(request.restaurantId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        DiningTable table = diningTableRepository.findById(request.tableId())
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
        UserAccount customer = userAccountRepository.findById(request.customerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Reservation reservation = new Reservation();
        reservation.setRestaurant(restaurant);
        reservation.setTableRef(table);
        reservation.setCustomer(customer);
        reservation.setReservationTime(request.reservationTime());
        reservation.setPartySize(request.partySize());
        reservation.setNotes(request.notes());
        reservation.setStatus(ReservationStatus.REQUESTED);
        return reservationRepository.save(reservation);
    }

    @Override
    public Reservation updateStatus(Long id, ReservationStatus status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        reservation.setStatus(status);
        return reservationRepository.save(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> findForRestaurantOnDate(Long restaurantId, LocalDate date) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return reservationRepository.findByRestaurantAndReservationTimeBetween(restaurant, start, end);
    }
}
