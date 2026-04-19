package com.culture.wanderers.dto;

import com.culture.wanderers.entity.Festival;
import lombok.Getter;

@Getter
public class AiRecommendFestivalItem {

    private final Long id;
    private final String title;
    private final String region;
    private final String location;
    private final String startDate;
    private final String endDate;
    private final String thumbnailUrl;
    private final String category;
    private final String price;
    private final String description;
    private final String tel;
    private final String homepageUrl;
    private final long reviewCount;
    private final long partyCount;

    public AiRecommendFestivalItem(Festival festival, long reviewCount, long partyCount) {
        this.id = festival.getId();
        this.title = festival.getTitle();
        this.region = festival.getRegion();
        this.location = festival.getLocation();
        this.startDate = festival.getStartDate();
        this.endDate = festival.getEndDate();
        this.thumbnailUrl = festival.getThumbnailUrl();
        this.category = festival.getCategory();
        this.price = festival.getPrice();
        this.description = festival.getDescription();
        this.tel = festival.getTel();
        this.homepageUrl = festival.getHomepageUrl();
        this.reviewCount = reviewCount;
        this.partyCount = partyCount;
    }
}