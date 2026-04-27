package com.culture.wanderers.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "parties")
@Getter
@Setter
public class Party {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String authorEmail;

    private String title;
    private String content;
    private String category;
    private int maxPeople;
    private int currentPeople;
    private LocalDateTime meetingTime;
    private LocalDateTime deadline;
    private String location;
    private String contact;
    private String status;
    private LocalDateTime createdAt;
    private Long festivalId;
    private String festivalTitle;

    @Transient
    private Long commentCount;

    @Transient
    private String authorNickname;
}
