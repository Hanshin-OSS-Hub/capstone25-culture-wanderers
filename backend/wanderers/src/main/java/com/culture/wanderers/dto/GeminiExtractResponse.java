package com.culture.wanderers.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeminiExtractResponse {
    private String intent;
    private String region;
    private String companions;
    private String category;
    private String date;
    private Integer priceMax;
    private List<String> keywords = new ArrayList<>();
}