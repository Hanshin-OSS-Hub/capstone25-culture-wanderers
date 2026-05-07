package com.culture.wanderers.dto;

import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.User;
import lombok.Getter;

@Getter
public class SavedFestivalResponse {

    private final Long id;
    private final String title;
    private final String region;
    private final String location;
    private final String startDate;
    private final String endDate;
    private final String thumbnailUrl;
    private final String category;
    private final String savedByEmail;
    private final String savedByNickname;

    public SavedFestivalResponse(Festival festival, User savedBy) {
        this.id = festival.getId();
        this.title = festival.getTitle();
        this.region = festival.getRegion();
        this.location = festival.getLocation();
        this.startDate = festival.getStartDate();
        this.endDate = festival.getEndDate();
        this.thumbnailUrl = festival.getThumbnailUrl();
        this.category = festival.getCategory();
        this.savedByEmail = savedBy != null ? savedBy.getEmail() : "";
        this.savedByNickname = savedBy != null ? savedBy.getNickname() : "";
    }
}
