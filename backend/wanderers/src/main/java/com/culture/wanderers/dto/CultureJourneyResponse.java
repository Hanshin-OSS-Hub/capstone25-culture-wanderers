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
    private List<JourneyStatItem> categoryStats;
    private int thisMonthVisits;
    private int cultureScore;

    public CultureJourneyResponse(
            int totalVisits,
            String levelName,
            String levelDescription,
            String topRegion,
            String topCategory,
            List<JourneyVisitItem> recentVisits,
            List<JourneyStatItem> regionStats,
            List<JourneyStatItem> categoryStats,
            int thisMonthVisits,
            int cultureScore
    ) {
        this.totalVisits = totalVisits;
        this.levelName = levelName;
        this.levelDescription = levelDescription;
        this.topRegion = topRegion;
        this.topCategory = topCategory;
        this.recentVisits = recentVisits;
        this.regionStats = regionStats;
        this.categoryStats = categoryStats;
        this.thisMonthVisits = thisMonthVisits;
        this.cultureScore = cultureScore;
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

    public List<JourneyStatItem> getCategoryStats() {
        return categoryStats;
    }

    public int getThisMonthVisits() {
        return thisMonthVisits;
    }

    public int getCultureScore() {
        return cultureScore;
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
