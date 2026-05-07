package com.culture.wanderers.dto;

import lombok.Getter;

@Getter
public class AiItineraryItem {

    private final String time;
    private final String title;
    private final String description;
    private final String location;
    private final String mapUrl;

    public AiItineraryItem(String time, String title, String description, String location, String mapUrl) {
        this.time = time;
        this.title = title;
        this.description = description;
        this.location = location;
        this.mapUrl = mapUrl;
    }
}
