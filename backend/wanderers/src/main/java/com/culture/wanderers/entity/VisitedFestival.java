package com.culture.wanderers.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
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

    private LocalDate visitDate;

    private String verificationMethod;

    private String verificationStatus;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String proofImageUrl;

    private Boolean calendarLinked = false;

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

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public String getVerificationMethod() {
        return verificationMethod;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public Boolean getCalendarLinked() {
        return calendarLinked;
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

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
    }

    public void setVerificationMethod(String verificationMethod) {
        this.verificationMethod = verificationMethod;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public void setProofImageUrl(String proofImageUrl) {
        this.proofImageUrl = proofImageUrl;
    }

    public void setCalendarLinked(Boolean calendarLinked) {
        this.calendarLinked = calendarLinked;
    }

    public void setVisitedAt(LocalDateTime visitedAt) {
        this.visitedAt = visitedAt;
    }
}
