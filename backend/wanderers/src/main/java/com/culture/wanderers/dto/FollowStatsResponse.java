package com.culture.wanderers.dto;

import lombok.Getter;

@Getter
public class FollowStatsResponse {

    private final long followerCount;
    private final long followingCount;
    private final boolean following;

    public FollowStatsResponse(long followerCount, long followingCount, boolean following) {
        this.followerCount = followerCount;
        this.followingCount = followingCount;
        this.following = following;
    }
}
