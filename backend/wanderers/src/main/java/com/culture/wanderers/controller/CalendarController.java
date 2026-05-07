package com.culture.wanderers.controller;

import com.culture.wanderers.entity.CalendarEvent;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CalendarEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class CalendarController {

    private final CalendarEventRepository calendarEventRepository;
    private final JwtUtil jwtUtil;

    public CalendarController(CalendarEventRepository calendarEventRepository, JwtUtil jwtUtil) {
        this.calendarEventRepository = calendarEventRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/api/calendar")
    public CalendarEvent addCalendarEvent(
            @RequestBody CalendarEvent event,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        event.setUserEmail(email);
        return calendarEventRepository.save(event);
    }

    @GetMapping("/api/me/calendar")
    public List<CalendarEvent> getMyCalendar(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        return calendarEventRepository.findByUserEmail(email);
    }

    @DeleteMapping("/api/calendar/{id}")
    public void deleteCalendarEvent(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        CalendarEvent event = calendarEventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "캘린더 일정 없음"));

        if (!email.equals(event.getUserEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 일정만 삭제 가능");
        }

        calendarEventRepository.deleteById(id);
    }

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류");
        }
    }
}