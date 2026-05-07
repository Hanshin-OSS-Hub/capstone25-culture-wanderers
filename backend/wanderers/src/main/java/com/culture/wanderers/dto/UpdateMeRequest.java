package com.culture.wanderers.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateMeRequest {
    private String nickname;
    private String password;
}
