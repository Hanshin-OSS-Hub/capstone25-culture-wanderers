package com.culture.wanderers.dto;

import java.util.List;

public class CultureJourneyResponse {

    private int totalVisits;
    private String levelName;
    private String levelDescription;
    private String topRegion;
    private String topCategory;
    private List<JourneyVisitItem> recentVisits;
    private List<JourneyStatItem> regionStats;

    public CultureJourneyResponse(
            int totalVisits,
            String levelName,
            String levelDescription,
            String topRegion,
            String topCategory,
            List<JourneyVisitItem> recentVisits,
            List<JourneyStatItem> regionStats
    ) {
        this.totalVisits = totalVisits;
        this.levelName = levelName;
        this.levelDescription = levelDescription;
        this.topRegion = topRegion;
        this.topCategory = topCategory;
        this.recentVisits = recentVisits;
        this.regionStats = regionStats;
    }

    public int getTotalVisits() {
        return totalVisits;
    }

    public String getLevelName() {
        return levelName;
    }

    public String getLevelDescription() {
        return levelDescription;
    }

    public String getTopRegion() {
        return topRegion;
    }

    public String getTopCategory() {
        return topCategory;
    }

    public List<JourneyVisitItem> getRecentVisits() {
        return recentVisits;
    }

    public List<JourneyStatItem> getRegionStats() {
        return regionStats;
    }

    public static class JourneyVisitItem {
        private Long festivalId;
        private String title;
        private String region;
        private String category;
        private String visitedAt;

        public JourneyVisitItem(Long festivalId, String title, String region, String category, String visitedAt) {
            this.festivalId = festivalId;
            this.title = title;
            this.region = region;
            this.category = category;
            this.visitedAt = visitedAt;
        }

        public Long getFestivalId() {
            return festivalId;
        }

        public String getTitle() {
            return title;
        }

        public String getRegion() {
            return region;
        }

        public String getCategory() {
            return category;
        }

        public String getVisitedAt() {
            return visitedAt;
        }
    }

    public static class JourneyStatItem {
        private String name;
        private int count;

        public JourneyStatItem(String name, int count) {
            this.name = name;
            this.count = count;
        }

        public String getName() {
            return name;
        }

        public int getCount() {
            return count;
        }
    }
}
