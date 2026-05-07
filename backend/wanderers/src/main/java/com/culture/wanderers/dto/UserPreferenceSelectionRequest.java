package com.culture.wanderers.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserPreferenceSelectionRequest {

    private List<String> regions = new ArrayList<>();
    private List<String> categories = new ArrayList<>();
}
