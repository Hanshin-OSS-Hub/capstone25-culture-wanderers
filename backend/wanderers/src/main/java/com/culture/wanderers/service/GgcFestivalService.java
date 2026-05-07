package com.culture.wanderers.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.culture.wanderers.entity.Festival;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class GgcFestivalService {

    private static final String SOURCE = "GGC";

    private final ExternalFestivalUpsertService upsertService;
    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String apiKey;
    private final String endpoint;

    public GgcFestivalService(
            ExternalFestivalUpsertService upsertService,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${ggc.enabled:true}") boolean enabled,
            @Value("${ggc.api-key:}") String apiKey,
            @Value("${ggc.endpoint:https://ggc.ggcf.kr/open/json/playongoing}") String endpoint
    ) {
        this.upsertService = upsertService;
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(4))
                .readTimeout(Duration.ofSeconds(8))
                .build();
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.endpoint = endpoint;
    }

    public int syncUpcoming(int limit) {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            return 0;
        }

        int safeLimit = Math.max(limit, 1);
        List<Festival> festivals = fetchPage(safeLimit);
        return festivals.stream()
                .map(upsertService::upsert)
                .mapToInt(saved -> saved.isPresent() ? 1 : 0)
                .sum();
    }

    private List<Festival> fetchPage(int limit) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(endpoint)
                .queryParam("KEY", apiKey)
                .queryParam("page", 0)
                .queryParam("perpage", Math.min(Math.max(limit, 10), 100));

        ResponseEntity<JsonNode> response = restTemplate.getForEntity(builder.build(true).toUri(), JsonNode.class);
        JsonNode root = response.getBody();
        if (root == null || root.isNull()) {
            return List.of();
        }

        List<JsonNode> items = findItems(root);
        List<Festival> festivals = new ArrayList<>();
        for (JsonNode item : items) {
            toFestival(item).ifPresent(festivals::add);
        }
        return festivals;
    }

    private Optional<Festival> toFestival(JsonNode item) {
        String title = clean(firstNonBlank(text(item, "subject"), text(item, "title")));
        String startDate = normalizeDate(firstNonBlank(text(item, "startdate"), text(item, "startDate")));
        if (title.isBlank() || startDate.isBlank()) {
            return Optional.empty();
        }

        String address = clean(firstNonBlank(text(item, "address"), text(item, "place")));
        String href = text(item, "href");
        String externalId = !href.isBlank() ? href : title + "|" + startDate;

        Festival festival = new Festival();
        festival.setSource(SOURCE);
        festival.setExternalId(externalId);
        festival.setTitle(title);
        festival.setRegion(extractRegion(address, "\uACBD\uAE30\uB3C4"));
        festival.setLocation(address.isBlank() ? "\uC7A5\uC18C \uC815\uBCF4 \uC5C6\uC74C" : address);
        festival.setStartDate(startDate);
        festival.setEndDate(defaultIfBlank(normalizeDate(firstNonBlank(text(item, "enddate"), text(item, "endDate"))), startDate));
        festival.setThumbnailUrl(firstNonBlank(text(item, "thumbnail"), text(item, "image")));
        festival.setCategory(defaultIfBlank(clean(text(item, "category")), "\uBB38\uD654\uD589\uC0AC"));
        festival.setPrice(defaultIfBlank(clean(text(item, "cost")), "\uC815\uBCF4 \uC5C6\uC74C"));
        festival.setDescription(clean(firstNonBlank(text(item, "contents"), text(item, "description"), text(item, "time"))));
        festival.setTel(clean(firstNonBlank(text(item, "quiry"), text(item, "tel"))));
        festival.setHomepageUrl(firstNonBlank(text(item, "homepage"), href));
        return Optional.of(festival);
    }

    private List<JsonNode> findItems(JsonNode root) {
        if (root.isArray()) {
            return toList(root);
        }

        for (String field : List.of("data", "list", "items", "item", "result")) {
            JsonNode node = root.path(field);
            if (node.isArray()) {
                return toList(node);
            }
        }

        JsonNode nested = root.path("response").path("body").path("items").path("item");
        if (nested.isArray()) {
            return toList(nested);
        }

        return List.of();
    }

    private List<JsonNode> toList(JsonNode array) {
        List<JsonNode> items = new ArrayList<>();
        array.forEach(items::add);
        return items;
    }

    private String normalizeDate(String value) {
        String digits = value == null ? "" : value.replaceAll("[^0-9]", "");
        return digits.length() >= 8 ? digits.substring(0, 8) : "";
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isMissingNode() || value.isNull() ? "" : value.asText("");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String extractRegion(String address, String fallback) {
        if (address == null || address.isBlank()) {
            return fallback;
        }
        String[] parts = address.trim().split("\\s+");
        return parts.length == 0 ? fallback : parts[0];
    }

    private String clean(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("<[^>]+>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
