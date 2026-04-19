package com.culture.wanderers.repository;

import com.culture.wanderers.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByUserEmail(String userEmail);

    void deleteByUserEmail(String userEmail);
}