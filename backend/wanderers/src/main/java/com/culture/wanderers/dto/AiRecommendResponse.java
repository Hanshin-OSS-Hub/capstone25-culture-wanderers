package com.culture.wanderers.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AiRecommendResponse {
    private final String query;
    private final GeminiExtractResponse extracted;
    private final List<AiRecommendFestivalItem> festivals;
    private final boolean fallbackUsed;
    private final String message;
}