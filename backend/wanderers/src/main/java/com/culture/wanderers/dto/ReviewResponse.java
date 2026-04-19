package com.culture.wanderers.dto;

import com.culture.wanderers.entity.Review;

import java.time.LocalDate;

public class ReviewResponse {
    private Long id;
    private String targetType;
    private Long targetId;
    private String targetTitle;
    private String title;
    private int rating;
    private String content;
    private LocalDate createdAt;

    public ReviewResponse(Review review) {
        this.id = review.getId();
        this.targetType = review.getTargetType();
        this.targetId = review.getTargetId();
        this.targetTitle = review.getTargetTitle();
        this.title = review.getTitle();
        this.rating = review.getRating();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getTargetType() { return targetType; }
    public Long getTargetId() { return targetId; }
    public String getTargetTitle() { return targetTitle; }
    public String getTitle() { return title; }
    public int getRating() { return rating; }
    public String getContent() { return content; }
    public LocalDate getCreatedAt() { return createdAt; }
}