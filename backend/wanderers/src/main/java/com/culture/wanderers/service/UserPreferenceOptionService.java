package com.culture.wanderers.service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.culture.wanderers.dto.UserPreferenceSelectionRequest;
import com.culture.wanderers.entity.UserPreferenceOption;
import com.culture.wanderers.repository.UserPreferenceOptionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserPreferenceOptionService {

    public static final String TYPE_REGION = "REGION";
    public static final String TYPE_CATEGORY = "CATEGORY";

    private final UserPreferenceOptionRepository repository;

    public List<String> getSelectedRegions(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(option -> TYPE_REGION.equals(option.getPreferenceType()))
                .map(UserPreferenceOption::getPreferenceValue)
                .distinct()
                .toList();
    }

    public List<String> getSelectedCategories(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(option -> TYPE_CATEGORY.equals(option.getPreferenceType()))
                .map(UserPreferenceOption::getPreferenceValue)
                .distinct()
                .toList();
    }

    @Transactional
    public void saveSelections(Long userId, UserPreferenceSelectionRequest request) {
        repository.deleteByUserIdAndPreferenceType(userId, TYPE_REGION);
        repository.deleteByUserIdAndPreferenceType(userId, TYPE_CATEGORY);

        saveOptions(userId, TYPE_REGION, request != null ? request.getRegions() : List.of());
        saveOptions(userId, TYPE_CATEGORY, request != null ? request.getCategories() : List.of());
    }

    private void saveOptions(Long userId, String type, List<String> values) {
        LinkedHashSet<String> uniqueValues = new LinkedHashSet<>();

        if (values != null) {
            for (String value : values) {
                String normalized = normalize(value);
                if (normalized != null) {
                    uniqueValues.add(normalized);
                }
            }
        }

        for (String value : uniqueValues.stream().limit(12).toList()) {
            UserPreferenceOption option = new UserPreferenceOption();
            option.setUserId(userId);
            option.setPreferenceType(type);
            option.setPreferenceValue(value);
            option.setCreatedAt(LocalDateTime.now());
            repository.save(option);
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return null;
        }

        return trimmed.toLowerCase(Locale.ROOT).equals("null") ? null : trimmed;
    }
}
