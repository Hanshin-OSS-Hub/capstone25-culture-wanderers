package com.culture.wanderers.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
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
public class GyeonggiDataDreamService {

    private static final String SOURCE = "GYEONGGI_DATA";
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final ExternalFestivalUpsertService upsertService;
    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String apiKey;
    private final String endpoint;
    private final String serviceName;

    public GyeonggiDataDreamService(
            ExternalFestivalUpsertService upsertService,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${gyeonggi-data.enabled:true}") boolean enabled,
            @Value("${gyeonggi-data.api-key:}") String apiKey,
            @Value("${gyeonggi-data.endpoint:}") String endpoint,
            @Value("${gyeonggi-data.service-name:}") String serviceName
    ) {
        this.upsertService = upsertService;
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(4))
                .readTimeout(Duration.ofSeconds(8))
                .build();
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.endpoint = endpoint;
        this.serviceName = serviceName;
    }

    public int syncUpcoming(int limit) {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            return 0;
        }

        String requestUrl = resolveEndpoint();
        if (requestUrl.isBlank()) {
            return 0;
        }

        List<Festival> festivals = fetch(requestUrl, Math.max(limit, 1));
        return festivals.stream()
                .map(upsertService::upsert)
                .mapToInt(saved -> saved.isPresent() ? 1 : 0)
                .sum();
    }

    private String resolveEndpoint() {
        if (endpoint != null && !endpoint.isBlank()) {
            return endpoint;
        }
        if (serviceName != null && !serviceName.isBlank() && !looksLikeApiKey(serviceName)) {
            return "https://openapi.gg.go.kr/" + serviceName;
        }
        return "https://openapi.gg.go.kr/TB25BPTTOURCRSM";
    }

    private boolean looksLikeApiKey(String value) {
        return value != null && value.matches("[0-9a-fA-F]{24,}");
    }

    private List<Festival> fetch(String requestUrl, int limit) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(requestUrl)
                .queryParam("KEY", apiKey)
                .queryParam("Type", "json")
                .queryParam("pIndex", 1)
                .queryParam("pSize", Math.min(Math.max(limit, 10), 1000));

        ResponseEntity<JsonNode> response = restTemplate.getForEntity(builder.build(false).encode().toUri(), JsonNode.class);
        JsonNode root = response.getBody();
        if (root == null || root.isNull()) {
            return List.of();
        }

        List<JsonNode> rows = findRows(root);
        List<Festival> festivals = new ArrayList<>();
        for (JsonNode row : rows) {
            toFestival(row).ifPresent(festivals::add);
        }
        return festivals;
    }

    private Optional<Festival> toFestival(JsonNode row) {
        String title = firstNonBlank(
                text(row, "RECOMEND_COURSE_NM"),
                text(row, "RECOMMEND_COURSE_NM"),
                text(row, "TOURIST_COURSE_NM"),
                text(row, "TOUR_COURSE_NM"),
                text(row, "COURSE_NM"),
                findValueByKeyHint(row, "COURSE", "NM")
        );

        if (title.isBlank()) {
            return Optional.empty();
        }

        String externalId = firstNonBlank(
                text(row, "RECOMEND_COURSE_ID"),
                text(row, "RECOMMEND_COURSE_ID"),
                text(row, "COURSE_ID"),
                findValueByKeyHint(row, "COURSE", "ID"),
                title
        );
        String today = LocalDate.now().format(BASIC_DATE);

        Festival festival = new Festival();
        festival.setSource(SOURCE);
        festival.setExternalId(externalId);
        festival.setTitle(title);
        festival.setRegion("\uACBD\uAE30\uB3C4");
        festival.setLocation("\uACBD\uAE30\uB3C4 \uCD94\uCC9C \uAD00\uAD11\uCF54\uC2A4");
        festival.setStartDate(today);
        festival.setEndDate(LocalDate.now().plusYears(1).format(BASIC_DATE));
        festival.setCategory("\uAD00\uAD11\uCF54\uC2A4");
        festival.setPrice("\uC815\uBCF4 \uC5C6\uC74C");
        festival.setDescription("\uACBD\uAE30\uB370\uC774\uD130\uB4DC\uB9BC \uAD00\uAD11\uC9C0\uCF54\uC2A4 \uBAA9\uB85D \uB370\uC774\uD130\uC785\uB2C8\uB2E4.");
        festival.setHomepageUrl("https://data.gg.go.kr/portal/data/service/selectServicePage.do?infId=6D1A8JJ6NY4PTTAKMUX438101731&infSeq=1");
        return Optional.of(festival);
    }

    private List<JsonNode> findRows(JsonNode root) {
        List<JsonNode> rows = new ArrayList<>();
        collectRows(root, rows);
        return rows;
    }

    private void collectRows(JsonNode node, List<JsonNode> rows) {
        if (node == null || node.isNull()) {
            return;
        }

        JsonNode row = node.path("row");
        if (row.isArray()) {
            row.forEach(rows::add);
        }

        if (node.isArray()) {
            node.forEach(child -> collectRows(child, rows));
            return;
        }

        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            collectRows(fields.next().getValue(), rows);
        }
    }

    private String findValueByKeyHint(JsonNode node, String required, String suffix) {
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String key = entry.getKey().toUpperCase();
            if (key.contains(required) && key.endsWith(suffix) && entry.getValue().isValueNode()) {
                return entry.getValue().asText("");
            }
        }
        return "";
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isMissingNode() || value.isNull() ? "" : value.asText("");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
