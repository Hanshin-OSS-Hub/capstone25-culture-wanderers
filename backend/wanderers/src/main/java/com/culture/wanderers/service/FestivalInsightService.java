package com.culture.wanderers.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.culture.wanderers.dto.FestivalSummaryDto;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.Party;
import com.culture.wanderers.entity.Review;
import com.culture.wanderers.entity.UserActivity;
import com.culture.wanderers.entity.UserLike;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.repository.ReviewRepository;
import com.culture.wanderers.repository.UserActivityRepository;
import com.culture.wanderers.repository.UserLikeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FestivalInsightService {

    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final FestivalRepository festivalRepository;
    private final ReviewRepository reviewRepository;
    private final UserLikeRepository userLikeRepository;
    private final UserActivityRepository userActivityRepository;
    private final PartyRepository partyRepository;

    public List<FestivalSummaryDto> summarize(List<Festival> festivals) {
        if (festivals == null || festivals.isEmpty()) {
            return List.of();
        }

        MetricsSnapshot metrics = buildMetricsSnapshot();
        Set<Long> popularFestivalIds = computePopularFestivalIds(metrics);

        return festivals.stream()
                .map(festival -> toSummary(festival, metrics, popularFestivalIds.contains(festival.getId())))
                .toList();
    }

    public List<FestivalSummaryDto> summarizeByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        Map<Long, Festival> festivalMap = festivalRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Festival::getId, festival -> festival));

        List<Festival> festivals = new ArrayList<>();
        for (Long id : ids) {
            Festival festival = festivalMap.get(id);
            if (festival != null) {
                festivals.add(festival);
            }
        }

        return summarize(festivals);
    }

    public List<FestivalSummaryDto> getPopularFestivals(int limit) {
        int safeLimit = Math.max(limit, 1);
        MetricsSnapshot metrics = buildMetricsSnapshot();
        Set<Long> popularFestivalIds = computePopularFestivalIds(metrics);
        LocalDate today = LocalDate.now();

        return festivalRepository.findAll().stream()
                .filter(festival -> isOngoingFestival(festival, today))
                .map(festival -> toSummary(festival, metrics, popularFestivalIds.contains(festival.getId())))
                .sorted(Comparator.comparingLong(FestivalSummaryDto::getPopularityScore).reversed()
                        .thenComparing(FestivalSummaryDto::getReviewCount, Comparator.reverseOrder())
                        .thenComparing(FestivalSummaryDto::getLikeCount, Comparator.reverseOrder()))
                .limit(safeLimit)
                .toList();
    }

    private FestivalSummaryDto toSummary(Festival festival, MetricsSnapshot metrics, boolean popular) {
        Long festivalId = festival.getId();
        long reviewCount = metrics.reviewCountByFestivalId.getOrDefault(festivalId, 0L);
        long likeCount = metrics.likeCountByFestivalId.getOrDefault(festivalId, 0L);
        long viewCount = metrics.viewCountByFestivalId.getOrDefault(festivalId, 0L);
        long partyCount = metrics.partyCountByFestivalId.getOrDefault(festivalId, 0L);
        double ratingAvg = metrics.ratingAvgByFestivalId.getOrDefault(festivalId, 0.0);
        long popularityScore = calculatePopularityScore(reviewCount, likeCount, viewCount, partyCount);

        return new FestivalSummaryDto(
                festival,
                reviewCount,
                likeCount,
                viewCount,
                partyCount,
                ratingAvg,
                popularityScore,
                popular
        );
    }

    private MetricsSnapshot buildMetricsSnapshot() {
        Map<Long, Long> reviewCountByFestivalId = new HashMap<>();
        Map<Long, Double> ratingAvgByFestivalId = new HashMap<>();
        Map<Long, Long> likeCountByFestivalId = new HashMap<>();
        Map<Long, Long> viewCountByFestivalId = new HashMap<>();
        Map<Long, Long> partyCountByFestivalId = new HashMap<>();

        for (Review review : reviewRepository.findAll()) {
            if (!"festival".equalsIgnoreCase(review.getTargetType()) || review.getTargetId() == null) {
                continue;
            }

            Long festivalId = review.getTargetId();
            reviewCountByFestivalId.merge(festivalId, 1L, Long::sum);
            ratingAvgByFestivalId.merge(festivalId, (double) review.getRating(), Double::sum);
        }

        ratingAvgByFestivalId.replaceAll((festivalId, totalRating) -> {
            long reviewCount = reviewCountByFestivalId.getOrDefault(festivalId, 1L);
            return totalRating / reviewCount;
        });

        for (UserLike like : userLikeRepository.findAll()) {
            if (!"festival".equalsIgnoreCase(like.getTargetType()) || like.getTargetId() == null) {
                continue;
            }

            likeCountByFestivalId.merge(like.getTargetId(), 1L, Long::sum);
        }

        for (UserActivity activity : userActivityRepository.findAll()) {
            if (activity.getFestivalId() == null || !"view".equalsIgnoreCase(activity.getActionType())) {
                continue;
            }

            viewCountByFestivalId.merge(activity.getFestivalId(), 1L, Long::sum);
        }

        for (Party party : partyRepository.findAll()) {
            if (party.getFestivalId() == null) {
                continue;
            }

            partyCountByFestivalId.merge(party.getFestivalId(), 1L, Long::sum);
        }

        return new MetricsSnapshot(
                reviewCountByFestivalId,
                ratingAvgByFestivalId,
                likeCountByFestivalId,
                viewCountByFestivalId,
                partyCountByFestivalId
        );
    }

    private Set<Long> computePopularFestivalIds(MetricsSnapshot metrics) {
        List<Festival> allFestivals = festivalRepository.findAll();
        if (allFestivals.isEmpty()) {
            return Set.of();
        }

        int popularCount = Math.max(1, (int) Math.ceil(allFestivals.size() * 0.1));

        return allFestivals.stream()
                .map(festival -> Map.entry(festival.getId(), calculatePopularityScore(
                        metrics.reviewCountByFestivalId.getOrDefault(festival.getId(), 0L),
                        metrics.likeCountByFestivalId.getOrDefault(festival.getId(), 0L),
                        metrics.viewCountByFestivalId.getOrDefault(festival.getId(), 0L),
                        metrics.partyCountByFestivalId.getOrDefault(festival.getId(), 0L)
                )))
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(popularCount)
                .filter(entry -> entry.getValue() > 0)
                .map(Map.Entry::getKey)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private long calculatePopularityScore(long reviewCount, long likeCount, long viewCount, long partyCount) {
        return (reviewCount * 5L) + (likeCount * 4L) + (viewCount * 2L) + (partyCount * 3L);
    }

    private boolean isOngoingFestival(Festival festival, LocalDate today) {
        LocalDate startDate = parseFestivalDate(festival.getStartDate());
        LocalDate endDate = parseFestivalDate(festival.getEndDate());

        if (startDate == null || endDate == null) {
            return true;
        }

        return !today.isBefore(startDate) && !today.isAfter(endDate);
    }

    private LocalDate parseFestivalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.contains("T")) {
            normalized = normalized.substring(0, normalized.indexOf('T'));
        }

        try {
            if (normalized.matches("\\d{8}")) {
                return LocalDate.parse(normalized, COMPACT_DATE_FORMATTER);
            }
            return LocalDate.parse(normalized);
        } catch (Exception ignored) {
            return null;
        }
    }

    private record MetricsSnapshot(
            Map<Long, Long> reviewCountByFestivalId,
            Map<Long, Double> ratingAvgByFestivalId,
            Map<Long, Long> likeCountByFestivalId,
            Map<Long, Long> viewCountByFestivalId,
            Map<Long, Long> partyCountByFestivalId
    ) {
    }
}
