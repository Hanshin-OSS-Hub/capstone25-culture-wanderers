package com.culture.wanderers.service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import com.culture.wanderers.entity.Festival;

@Service
public class KopisFestivalService {

    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String SOURCE = "KOPIS";

    private final ExternalFestivalUpsertService upsertService;
    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String apiKey;
    private final String endpoint;

    public KopisFestivalService(
            ExternalFestivalUpsertService upsertService,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${kopis.enabled:true}") boolean enabled,
            @Value("${kopis.api-key:}") String apiKey,
            @Value("${kopis.endpoint:http://www.kopis.or.kr/openApi/restful/pblprfr}") String endpoint
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

        LocalDate today = LocalDate.now();
        List<Festival> festivals = fetchPerformances(today, today.plusDays(31), Math.max(limit, 1));
        return festivals.stream()
                .map(upsertService::upsert)
                .mapToInt(saved -> saved.isPresent() ? 1 : 0)
                .sum();
    }

    private List<Festival> fetchPerformances(LocalDate start, LocalDate end, int limit) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(endpoint)
                .queryParam("service", apiKey)
                .queryParam("stdate", start.format(BASIC_DATE))
                .queryParam("eddate", end.format(BASIC_DATE))
                .queryParam("cpage", 1)
                .queryParam("rows", Math.min(Math.max(limit, 10), 100));

        ResponseEntity<String> response = restTemplate.getForEntity(builder.build(true).toUri(), String.class);
        return parseXml(response.getBody());
    }

    private List<Festival> parseXml(String xml) {
        if (xml == null || xml.isBlank()) {
            return List.of();
        }

        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            Document document = factory.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

            NodeList nodes = document.getElementsByTagName("db");
            List<Festival> festivals = new ArrayList<>();
            for (int i = 0; i < nodes.getLength(); i++) {
                if (nodes.item(i) instanceof Element element) {
                    toFestival(element).ifPresent(festivals::add);
                }
            }
            return festivals;
        } catch (Exception e) {
            return List.of();
        }
    }

    private Optional<Festival> toFestival(Element element) {
        String id = childText(element, "mt20id");
        String title = childText(element, "prfnm");
        String startDate = normalizeDate(childText(element, "prfpdfrom"));
        if (id.isBlank() || title.isBlank() || startDate.isBlank()) {
            return Optional.empty();
        }

        String venue = childText(element, "fcltynm");
        String genre = childText(element, "genrenm");

        Festival festival = new Festival();
        festival.setSource(SOURCE);
        festival.setExternalId(id);
        festival.setTitle(title);
        festival.setRegion("\uACF5\uC5F0");
        festival.setLocation(venue.isBlank() ? "\uACF5\uC5F0\uC7A5 \uC815\uBCF4 \uC5C6\uC74C" : venue);
        festival.setStartDate(startDate);
        festival.setEndDate(defaultIfBlank(normalizeDate(childText(element, "prfpdto")), startDate));
        festival.setThumbnailUrl(childText(element, "poster"));
        festival.setCategory(defaultIfBlank(genre, "\uACF5\uC5F0"));
        festival.setPrice("\uC815\uBCF4 \uC5C6\uC74C");
        festival.setDescription(childText(element, "prfstate"));
        festival.setHomepageUrl("https://kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=" + id);
        return Optional.of(festival);
    }

    private String childText(Element element, String tagName) {
        NodeList nodes = element.getElementsByTagName(tagName);
        if (nodes.getLength() == 0 || nodes.item(0) == null) {
            return "";
        }
        return nodes.item(0).getTextContent().trim();
    }

    private String normalizeDate(String value) {
        String digits = value == null ? "" : value.replaceAll("[^0-9]", "");
        return digits.length() >= 8 ? digits.substring(0, 8) : "";
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
