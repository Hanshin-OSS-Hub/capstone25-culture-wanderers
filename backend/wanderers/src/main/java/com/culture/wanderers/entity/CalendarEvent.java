package com.culture.wanderers.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    // festival / 파티
    private String targetType;

    private Long targetId;

    private String title;

    private LocalDate startDate;
    private LocalDate endDate;

    private String location;
}