package com.culture.wanderers.dto;

public class RecommendationResponse {

    private String targetType;
    private Long targetId;
    private String reason;

    public RecommendationResponse(String targetType, Long targetId, String reason) {
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
    }

    public String getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public String getReason() {
        return reason;
    }
}