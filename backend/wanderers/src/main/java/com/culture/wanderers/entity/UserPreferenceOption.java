package com.culture.wanderers.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "user_preference_options")
public class UserPreferenceOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "preference_type", nullable = false, length = 30)
    private String preferenceType;

    @Column(name = "preference_value", nullable = false, length = 100)
    private String preferenceValue;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
