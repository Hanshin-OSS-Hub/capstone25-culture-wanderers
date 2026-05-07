package com.culture.wanderers.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiRecommendRequest {
    private String query;
    private Integer limit;
    private List<Long> excludeIds = new ArrayList<>();
    private List<String> categories = new ArrayList<>();
    private Long targetFestivalId;
}
