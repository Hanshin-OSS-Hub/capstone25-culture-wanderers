package com.culture.wanderers.controller;

import com.culture.wanderers.dto.CultureJourneyResponse;
import com.culture.wanderers.entity.CalendarEvent;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.VisitedFestival;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CalendarEventRepository;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.VisitedFestivalRepository;
import com.culture.wanderers.service.CultureJourneyService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class VisitedFestivalController {

    private static final int LOCATION_CERTIFICATION_RADIUS_METERS = 2000;

    private final VisitedFestivalRepository visitedFestivalRepository;
    private final FestivalRepository festivalRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final JwtUtil jwtUtil;
    private final CultureJourneyService cultureJourneyService;

    public VisitedFestivalController(
            VisitedFestivalRepository visitedFestivalRepository,
            FestivalRepository festivalRepository,
            CalendarEventRepository calendarEventRepository,
            JwtUtil jwtUtil,
            CultureJourneyService cultureJourneyService
    ) {
        this.visitedFestivalRepository = visitedFestivalRepository;
        this.festivalRepository = festivalRepository;
        this.calendarEventRepository = calendarEventRepository;
        this.jwtUtil = jwtUtil;
        this.cultureJourneyService = cultureJourneyService;
    }

    @GetMapping("/api/me/visited-festivals")
    public List<VisitedFestival> getMyVisitedFestivals(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        return visitedFestivalRepository.findByUserEmailOrderByVisitedAtDesc(email);
    }

    @GetMapping("/api/me/journey")
    public CultureJourneyResponse getMyJourney(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        return cultureJourneyService.getJourney(email);
    }

    @GetMapping("/api/users/{userEmail}/journey")
    public CultureJourneyResponse getUserJourney(@PathVariable String userEmail) {
        return cultureJourneyService.getJourney(userEmail);
    }

    @PostMapping("/api/me/visited-festivals")
    public VisitedFestival addVisitedFestival(
            @RequestBody Map<String, String> body,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        Long festivalId = Long.parseLong(body.get("festivalId"));
        Festival festival = festivalRepository.findById(festivalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다."));
        String festivalTitle = body.getOrDefault("festivalTitle", festival.getTitle());
        LocalDate visitDate = parseVisitDate(body.get("visitDate"));
        if (visitDate == null) {
            visitDate = LocalDate.now();
        }

        validateVisitDateInFestivalPeriod(festival, visitDate);

        String verificationMethod = normalizeVerificationMethod(body.get("verificationMethod"), body.get("proofImageUrl"));
        validateVerificationEvidence(verificationMethod, body, visitDate);
        boolean calendarLinked = ensureCalendarEvent(email, festival, visitDate);

        if (visitedFestivalRepository.existsByUserEmailAndFestivalId(email, festivalId)) {
            VisitedFestival visitedFestival = visitedFestivalRepository.findByUserEmailAndFestivalId(email, festivalId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방문 행사 기록이 없어요."));
            visitedFestival.setFestivalTitle(festivalTitle);
            visitedFestival.setVisitDate(visitDate);
            visitedFestival.setVerificationMethod(verificationMethod);
            visitedFestival.setVerificationStatus(resolveVerificationStatus(verificationMethod, calendarLinked));
            visitedFestival.setProofImageUrl(body.get("proofImageUrl"));
            visitedFestival.setCalendarLinked(calendarLinked);
            return visitedFestivalRepository.save(visitedFestival);
        }

        VisitedFestival visitedFestival = new VisitedFestival();
        visitedFestival.setUserEmail(email);
        visitedFestival.setFestivalId(festivalId);
        visitedFestival.setFestivalTitle(festivalTitle);
        visitedFestival.setVisitDate(visitDate);
        visitedFestival.setVerificationMethod(verificationMethod);
        visitedFestival.setVerificationStatus(resolveVerificationStatus(verificationMethod, calendarLinked));
        visitedFestival.setProofImageUrl(body.get("proofImageUrl"));
        visitedFestival.setCalendarLinked(calendarLinked);

        return visitedFestivalRepository.save(visitedFestival);
    }

    @DeleteMapping("/api/me/visited-festivals/{festivalId}")
    public void deleteVisitedFestival(
            @PathVariable Long festivalId,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        VisitedFestival visitedFestival = visitedFestivalRepository
                .findByUserEmailAndFestivalId(email, festivalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방문 행사 기록이 없어요."));

        visitedFestivalRepository.delete(visitedFestival);
    }

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰이 없어요.");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류");
        }
    }

    private LocalDate parseVisitDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방문일 형식이 올바르지 않습니다.");
        }
    }

    private LocalDate parseFestivalDate(String value) {
        if (value == null || value.isBlank() || value.startsWith("0000")) {
            return null;
        }

        String date = value.trim();
        try {
            if (date.length() == 8) {
                return LocalDate.parse(
                        date.substring(0, 4) + "-" + date.substring(4, 6) + "-" + date.substring(6, 8)
                );
            }
            if (date.length() >= 10) {
                return LocalDate.parse(date.substring(0, 10));
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private void validateVisitDateInFestivalPeriod(Festival festival, LocalDate visitDate) {
        LocalDate startDate = parseFestivalDate(festival.getStartDate());
        LocalDate endDate = parseFestivalDate(festival.getEndDate());

        if (startDate != null && visitDate.isBefore(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "행사 시작일 이후의 방문일만 인증할 수 있습니다.");
        }

        if (endDate != null && visitDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "행사 종료일 이전의 방문일만 인증할 수 있습니다.");
        }
    }

    private String normalizeVerificationMethod(String method, String proofImageUrl) {
        if (proofImageUrl != null && !proofImageUrl.isBlank()) {
            return "PHOTO";
        }

        if (method == null || method.isBlank()) {
            return "PHOTO";
        }

        String normalized = method.trim().toUpperCase();
        if (List.of("PHOTO", "LOCATION").contains(normalized)) {
            return normalized;
        }

        return "PHOTO";
    }

    private void validateVerificationEvidence(String method, Map<String, String> body, LocalDate visitDate) {
        if ("PHOTO".equals(method)) {
            String proofImageUrl = body.get("proofImageUrl");
            if (proofImageUrl == null || proofImageUrl.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사진 인증에는 방문 사진이 필요합니다.");
            }

            LocalDate capturedDate = parseProofCapturedDate(body.get("proofCapturedAt"));
            if (capturedDate == null || capturedDate.isBefore(visitDate.minusDays(1)) || capturedDate.isAfter(visitDate.plusDays(1))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방문일 전후 1일 안에 촬영 또는 저장된 사진만 인증할 수 있습니다.");
            }
            return;
        }

        if ("LOCATION".equals(method)) {
            Integer distanceMeters = parseDistanceMeters(body.get("locationDistanceMeters"));
            if (distanceMeters == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "위치 인증에는 행사장과 현재 위치의 거리 정보가 필요합니다.");
            }
            if (distanceMeters > LOCATION_CERTIFICATION_RADIUS_METERS) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "위치 인증은 행사장 2km 이내에서만 가능합니다.");
            }
        }
    }

    private LocalDate parseProofCapturedDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return OffsetDateTime.parse(value).toLocalDate();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(value).toLocalDate();
            } catch (Exception ignoredAgain) {
                try {
                    return LocalDate.parse(value.substring(0, Math.min(10, value.length())));
                } catch (Exception ignoredThird) {
                    return null;
                }
            }
        }
    }

    private Integer parseDistanceMeters(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return (int) Math.round(Double.parseDouble(value.trim()));
        } catch (Exception e) {
            return null;
        }
    }

    private boolean ensureCalendarEvent(String email, Festival festival, LocalDate visitDate) {
        List<CalendarEvent> events = calendarEventRepository.findByUserEmailAndTargetTypeAndTargetId(
                email,
                "festival",
                festival.getId()
        );

        boolean alreadyLinked = events.stream().anyMatch(event -> {
            LocalDate start = event.getStartDate();
            LocalDate end = event.getEndDate() != null ? event.getEndDate() : start;
            return start != null && !visitDate.isBefore(start) && !visitDate.isAfter(end);
        });

        if (alreadyLinked) {
            return true;
        }

        CalendarEvent event = new CalendarEvent();
        event.setUserEmail(email);
        event.setTargetType("festival");
        event.setTargetId(festival.getId());
        event.setTitle(festival.getTitle());
        event.setLocation(festival.getLocation());
        event.setStartDate(visitDate);
        event.setEndDate(visitDate);
        calendarEventRepository.save(event);
        return true;
    }

    private String resolveVerificationStatus(String verificationMethod, boolean calendarLinked) {
        if ("PHOTO".equals(verificationMethod)) {
            return "PHOTO_SUBMITTED";
        }
        if ("LOCATION".equals(verificationMethod)) {
            return "LOCATION_SUBMITTED";
        }
        return calendarLinked ? "CALENDAR_LINKED_SELF_CHECKED" : "SELF_CHECKED";
    }
}
