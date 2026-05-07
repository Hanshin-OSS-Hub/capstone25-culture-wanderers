package com.culture.wanderers.dto;

import com.culture.wanderers.entity.User;
import lombok.Getter;

@Getter
public class UserFollowProfileResponse {

    private final String email;
    private final String nickname;
    private final String profileImage;

    public UserFollowProfileResponse(User user) {
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.profileImage = user.getProfileImage();
    }
}
