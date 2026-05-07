package com.culture.wanderers.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.culture.wanderers.entity.UserActivity;
import com.culture.wanderers.service.UserActivityService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserActivityController {

    private final UserActivityService userActivityService;

    @PostMapping
    public void save(
            @RequestBody UserActivity activity,
            @AuthenticationPrincipal String email
    ) {
        userActivityService.save(
                email,
                activity.getUserId(),
                activity.getActionType(),
                activity.getFestivalId(),
                activity.getCategory(),
                activity.getRegion(),
                activity.getKeyword()
        );
    }
}
