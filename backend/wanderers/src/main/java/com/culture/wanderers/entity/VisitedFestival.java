package com.culture.wanderers.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "visited_festivals")
public class VisitedFestival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    private Long festivalId;

    private String festivalTitle;

    private LocalDateTime visitedAt;

    @PrePersist
    public void prePersist() {
        if (visitedAt == null) {
            visitedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public Long getFestivalId() {
        return festivalId;
    }

    public String getFestivalTitle() {
        return festivalTitle;
    }

    public LocalDateTime getVisitedAt() {
        return visitedAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public void setFestivalId(Long festivalId) {
        this.festivalId = festivalId;
    }

    public void setFestivalTitle(String festivalTitle) {
        this.festivalTitle = festivalTitle;
    }

    public void setVisitedAt(LocalDateTime visitedAt) {
        this.visitedAt = visitedAt;
    }
}