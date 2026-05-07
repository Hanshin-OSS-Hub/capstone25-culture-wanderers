package com.culture.wanderers.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String authorEmail;

    @Column(nullable = false)
    private String targetType;

    private Long targetId;

    private String targetTitle;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDate createdAt;

    @Column(name = "is_anonymous")
    private Boolean isAnonymous = false;

    @Transient
    private String authorNickname;

    @Transient
    private Long commentCount;

    @Transient
    private List<String> authorTrustBadges;

    @Transient
    private Integer authorTrustScore;

    @Transient
    private Long authorVerifiedReviewCount;

    @Transient
    private Long authorPartyReviewCount;
}
