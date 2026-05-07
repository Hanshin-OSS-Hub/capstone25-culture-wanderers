package com.culture.wanderers.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.culture.wanderers.service.ExternalFestivalSyncService;

@RestController
@CrossOrigin(origins = "*")
public class FestivalSyncController {

    private final ExternalFestivalSyncService externalFestivalSyncService;

    public FestivalSyncController(ExternalFestivalSyncService externalFestivalSyncService) {
        this.externalFestivalSyncService = externalFestivalSyncService;
    }

    @PostMapping("/api/festivals/sync")
    public Map<String, Object> syncFestivals(
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit
    ) {
        return externalFestivalSyncService.syncAll(limit);
    }
}
