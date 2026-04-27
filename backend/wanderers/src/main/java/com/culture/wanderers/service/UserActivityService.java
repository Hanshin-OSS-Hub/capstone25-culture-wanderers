package com.culture.wanderers.service;

import org.springframework.stereotype.Service;

import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.UserActivity;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.UserActivityRepository;
import com.culture.wanderers.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserActivityRepository userActivityRepository;
    private final UserRepository userRepository;
    private final FestivalRepository festivalRepository;

    public void save(String email, String actionType, Long festivalId, String category, String region, String keyword) {
        save(email, null, actionType, festivalId, category, region, keyword);
    }

    public void save(String email, Long fallbackUserId, String actionType, Long festivalId, String category, String region, String keyword) {
        if (actionType == null || actionType.isBlank()) {
            return;
        }

        Long userId = null;

        if (email != null && !email.isBlank()) {
            userId = userRepository.findByEmail(email)
                    .map(user -> user.getId().longValue())
                    .orElse(null);
        }

        if (userId == null) {
            userId = fallbackUserId != null ? fallbackUserId : 1L;
        }

        UserActivity activity = new UserActivity();
        activity.setUserId(userId);
        activity.setActionType(actionType);
        activity.setFestivalId(festivalId);
        activity.setCategory(category);
        activity.setRegion(region);
        activity.setKeyword(keyword);

        if (festivalId != null && (activity.getCategory() == null || activity.getRegion() == null)) {
            festivalRepository.findById(festivalId).ifPresent(festival -> fillFestivalFields(activity, festival));
        }

        userActivityRepository.save(activity);
    }

    private void fillFestivalFields(UserActivity activity, Festival festival) {
        if (activity.getCategory() == null) {
            activity.setCategory(festival.getCategory());
        }

        if (activity.getRegion() == null) {
            activity.setRegion(festival.getRegion());
        }
    }
}
