package com.culture.wanderers.dto;

import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.User;
import lombok.Getter;

import java.util.List;

@Getter
public class UserDiscoveryResponse {

    private final String email;
    private final String nickname;
    private final String profileImage;
    private final long followerCount;
    private final long followingCount;
    private final boolean following;
    private final boolean mutualFollow;
    private final int savedFestivalCount;
    private final int overlapCount;
    private final int likeOverlapCount;
    private final int regionOverlapCount;
    private final int categoryOverlapCount;
    private final int matchScore;
    private final List<String> matchReasons;
    private final List<String> sampleSavedFestivalTitles;
    private final List<SavedFestivalSummary> sampleSavedFestivals;

    public UserDiscoveryResponse(
            User user,
            long followerCount,
            long followingCount,
            boolean following,
            boolean mutualFollow,
            int savedFestivalCount,
            int overlapCount,
            int likeOverlapCount,
            int regionOverlapCount,
            int categoryOverlapCount,
            List<String> matchReasons,
            List<SavedFestivalSummary> sampleSavedFestivals
    ) {
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.profileImage = user.getProfileImage();
        this.followerCount = followerCount;
        this.followingCount = followingCount;
        this.following = following;
        this.mutualFollow = mutualFollow;
        this.savedFestivalCount = savedFestivalCount;
        this.overlapCount = overlapCount;
        this.likeOverlapCount = likeOverlapCount;
        this.regionOverlapCount = regionOverlapCount;
        this.categoryOverlapCount = categoryOverlapCount;
        this.matchScore = Math.min(
                99,
                30
                        + savedFestivalCount * 3
                        + overlapCount * 20
                        + likeOverlapCount * 14
                        + regionOverlapCount * 10
                        + categoryOverlapCount * 12
                        + (following ? 8 : 0)
                        + (mutualFollow ? 12 : 0)
        );
        this.matchReasons = matchReasons;
        this.sampleSavedFestivals = sampleSavedFestivals;
        this.sampleSavedFestivalTitles = sampleSavedFestivals.stream()
                .map(SavedFestivalSummary::getTitle)
                .toList();
    }

    @Getter
    public static class SavedFestivalSummary {
        private final Long id;
        private final String title;
        private final String region;
        private final String category;
        private final String location;

        public SavedFestivalSummary(Festival festival) {
            this.id = festival.getId();
            this.title = festival.getTitle();
            this.region = festival.getRegion();
            this.category = festival.getCategory();
            this.location = festival.getLocation();
        }
    }
}
