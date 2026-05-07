package com.culture.wanderers.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.culture.wanderers.entity.Festival;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class CultureDataPortalFestivalService {

    private static final String SOURCE = "CULTURE_DATA";
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final ExternalFestivalUpsertService upsertService;
    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String apiKey;
    private final String endpoint;

    public CultureDataPortalFestivalService(
            ExternalFestivalUpsertService upsertService,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${culture-data.enabled:true}") boolean enabled,
            @Value("${culture-data.api-key:}") String apiKey,
            @Value("${culture-data.endpoint:https://api.kcisa.kr/openapi/API_TOU_053/request}") String endpoint
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
        if (!enabled || apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return 0;
        }

        List<Festival> festivals = fetch(limit);
        return festivals.stream()
                .map(upsertService::upsert)
                .mapToInt(saved -> saved.isPresent() ? 1 : 0)
                .sum();
    }

    private List<Festival> fetch(int limit) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(endpoint)
                .queryParam("serviceKey", apiKey)
                .queryParam("numOfRows", Math.min(Math.max(limit, 10), 100))
                .queryParam("pageNo", 1)
                .queryParam("keyword", "");

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        ResponseEntity<JsonNode> response = restTemplate.exchange(
                builder.build(false).encode().toUri(),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        );
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
        String title = clean(firstNonBlank(text(item, "showTitle"), text(item, "title"), text(item, "subject"), text(item, "eventNm"), text(item, "cntntsSj")));
        String startDate = normalizeDate(firstNonBlank(text(item, "startDate"), text(item, "startdate"), text(item, "eventStartDate"), text(item, "period"), text(item, "issuedDate")));
        if (startDate.isBlank()) {
            startDate = LocalDate.now().format(BASIC_DATE);
        }
        if (title.isBlank() || startDate.isBlank()) {
            return Optional.empty();
        }

        String address = clean(firstNonBlank(text(item, "address"), text(item, "spatial"), text(item, "place"), text(item, "eventPlace")));
        String url = firstNonBlank(text(item, "url"), text(item, "homepage"), text(item, "referenceUrl"));
        String externalId = firstNonBlank(text(item, "id"), text(item, "cntntsId"), url, title + "|" + address + "|" + startDate);

        Festival festival = new Festival();
        festival.setSource(SOURCE);
        festival.setExternalId(externalId);
        festival.setTitle(title);
        festival.setRegion(extractRegion(address, "\uBB38\uD654"));
        festival.setLocation(address.isBlank() ? "\uC7A5\uC18C \uC815\uBCF4 \uC5C6\uC74C" : address);
        festival.setStartDate(startDate);
        festival.setEndDate(defaultIfBlank(normalizeDate(firstNonBlank(text(item, "endDate"), text(item, "enddate"), text(item, "eventEndDate"))), startDate));
        festival.setThumbnailUrl(firstNonBlank(text(item, "thumbnail"), text(item, "image"), text(item, "imgUrl")));
        festival.setCategory(defaultIfBlank(clean(firstNonBlank(text(item, "showType"), text(item, "category3"), text(item, "category2"), text(item, "category"), text(item, "realmName"))), "\uACF5\uC5F0\uC7A5"));
        festival.setPrice(defaultIfBlank(clean(firstNonBlank(text(item, "price"), text(item, "charge"), text(item, "useFee"))), "\uC815\uBCF4 \uC5C6\uC74C"));
        festival.setDescription(clean(firstNonBlank(text(item, "showInfo"), text(item, "description"), text(item, "contents"), text(item, "content"), text(item, "title"))));
        festival.setTel(clean(firstNonBlank(text(item, "tel"), text(item, "phone"))));
        festival.setHomepageUrl(url);
        return Optional.of(festival);
    }

    private List<JsonNode> findItems(JsonNode root) {
        JsonNode nested = root.path("response").path("body").path("items").path("item");
        if (nested.isArray()) {
            return toList(nested);
        }
        for (String field : List.of("data", "list", "items", "item", "result")) {
            JsonNode node = root.path(field);
            if (node.isArray()) {
                return toList(node);
            }
        }
        return root.isArray() ? toList(root) : List.of();
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
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String extractRegion(String address, String fallback) {
        if (address == null || address.isBlank()) return fallback;
        String[] parts = address.trim().split("\\s+");
        return parts.length == 0 ? fallback : parts[0];
    }

    private String clean(String value) {
        if (value == null) return "";
        return value.replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("<[^>]+>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
