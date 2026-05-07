package com.culture.wanderers.service;

import com.culture.wanderers.dto.GeminiExtractResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GeminiRecommendationService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    public GeminiRecommendationService(
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            ObjectMapper objectMapper
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.objectMapper = objectMapper;
    }

    public GeminiExtractResponse extractConditions(String userQuery) {
    System.out.println("=== GEMINI DEBUG START ===");
    System.out.println("apiKey is blank? " + (apiKey == null || apiKey.isBlank()));
    System.out.println("apiKey prefix: " + (apiKey != null && apiKey.length() >= 8 ? apiKey.substring(0, 8) : apiKey));
    System.out.println("model: " + model);

    if (apiKey == null || apiKey.isBlank()) {
        throw new IllegalStateException("GEMINI_API_KEY가 설정되지 않았습니다.");
    }

    String prompt = buildPrompt(userQuery);

    Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                    Map.of(
                            "parts", List.of(
                                    Map.of("text", prompt)
                            )
                    )
            ),
            "generationConfig", Map.of(
                    "temperature", 0.1,
                    "responseMimeType", "application/json"
            )
    );

    JsonNode response = restClient.post()
            .uri(uriBuilder -> uriBuilder
                    .path("/v1beta/models/{model}:generateContent")
                    .queryParam("key", apiKey)
                    .build(model))
            .body(requestBody)
            .retrieve()
            .body(JsonNode.class);

    String jsonText = extractText(response);
    String normalized = stripMarkdownFence(jsonText);

    try {
        return objectMapper.readValue(normalized, GeminiExtractResponse.class);
    } catch (Exception e) {
        throw new IllegalStateException("Gemini 응답 JSON 파싱 실패: " + normalized, e);
    }
}

    private String buildPrompt(String userQuery) {
        return """
                너는 문화행사 추천 시스템의 조건 추출기다.
                사용자 자연어 문장에서 검색 조건을 JSON으로만 추출해라.
                설명 문장 없이 반드시 JSON만 반환해라.

                허용 규칙:
                - intent: recommend_festival 또는 search_festival
                - region: 지역명 또는 null
                - companions: solo, friend, couple, family, group 또는 null
                - category: 축제, 공연, 전시 또는 null
                - date: YYYYMMDD 또는 null
                - priceMax: 숫자 또는 null
                - keywords: 문자열 배열

                반환 예시:
                {
                  "intent": "recommend_festival",
                  "region": "서울",
                  "companions": "friend",
                  "category": "축제",
                  "date": null,
                  "priceMax": null,
                  "keywords": ["서울", "친구", "축제"]
                }

                사용자 입력:
                %s
                """.formatted(userQuery);
    }

    private String extractText(JsonNode root) {
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini 응답에 candidates가 없습니다.");
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new IllegalStateException("Gemini 응답에 text가 없습니다.");
        }

        String text = parts.get(0).path("text").asText();
        if (text == null || text.isBlank()) {
            throw new IllegalStateException("Gemini 응답 text가 비어 있습니다.");
        }

        return text;
    }

    private String stripMarkdownFence(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7).trim();
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3).trim();
        }

        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
        }

        return trimmed;
    }
}