package com.culture.wanderers.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.repository.FestivalRepository;

@Service
public class ExternalFestivalUpsertService {

    private final FestivalRepository festivalRepository;

    public ExternalFestivalUpsertService(FestivalRepository festivalRepository) {
        this.festivalRepository = festivalRepository;
    }

    public Optional<Festival> upsert(Festival incoming) {
        if (incoming == null || isBlank(incoming.getTitle()) || isBlank(incoming.getStartDate())) {
            return Optional.empty();
        }

        try {
            Festival target = resolveTarget(incoming);
            copyFields(target, incoming);
            return Optional.of(festivalRepository.save(target));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Festival resolveTarget(Festival incoming) {
        if (!isBlank(incoming.getSource()) && !isBlank(incoming.getExternalId())) {
            Optional<Festival> sourceMatch = festivalRepository
                    .findFirstBySourceAndExternalId(incoming.getSource(), incoming.getExternalId())
                    .or(() -> festivalRepository.findFirstByTitleAndStartDate(incoming.getTitle(), incoming.getStartDate()));
            return sourceMatch.orElseGet(Festival::new);
        }

        return festivalRepository
                .findFirstByTitleAndStartDate(incoming.getTitle(), incoming.getStartDate())
                .orElseGet(Festival::new);
    }

    private void copyFields(Festival target, Festival incoming) {
        target.setTitle(incoming.getTitle());
        target.setRegion(incoming.getRegion());
        target.setLocation(incoming.getLocation());
        target.setStartDate(incoming.getStartDate());
        target.setEndDate(incoming.getEndDate());
        target.setThumbnailUrl(incoming.getThumbnailUrl());
        target.setCategory(incoming.getCategory());
        target.setPrice(incoming.getPrice());
        target.setDescription(incoming.getDescription());
        target.setTel(incoming.getTel());
        target.setHomepageUrl(incoming.getHomepageUrl());
        target.setSource(incoming.getSource());
        target.setExternalId(incoming.getExternalId());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
