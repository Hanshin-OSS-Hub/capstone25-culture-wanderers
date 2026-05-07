package com.culture.wanderers.dto;

import java.util.List;

public class UserPreferenceResponse {

    private String topRegion;
    private String topCategory;
    private List<String> topKeywords;
    private int activityCount;
    private List<String> selectedRegions;
    private List<String> selectedCategories;

    public UserPreferenceResponse(
            String topRegion,
            String topCategory,
            List<String> topKeywords,
            int activityCount,
            List<String> selectedRegions,
            List<String> selectedCategories
    ) {
        this.topRegion = topRegion;
        this.topCategory = topCategory;
        this.topKeywords = topKeywords;
        this.activityCount = activityCount;
        this.selectedRegions = selectedRegions;
        this.selectedCategories = selectedCategories;
    }

    public String getTopRegion() {
        return topRegion;
    }

    public String getTopCategory() {
        return topCategory;
    }

    public List<String> getTopKeywords() {
        return topKeywords;
    }

    public int getActivityCount() {
        return activityCount;
    }

    public List<String> getSelectedRegions() {
        return selectedRegions;
    }

    public List<String> getSelectedCategories() {
        return selectedCategories;
    }
}
