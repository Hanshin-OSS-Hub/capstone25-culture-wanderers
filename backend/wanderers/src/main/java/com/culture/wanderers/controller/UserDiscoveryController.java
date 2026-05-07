package com.culture.wanderers.controller;

import com.culture.wanderers.dto.UserDiscoveryResponse;
import com.culture.wanderers.dto.UserDiscoveryResponse.SavedFestivalSummary;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.entity.UserLike;
import com.culture.wanderers.entity.UserSave;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.UserFollowRepository;
import com.culture.wanderers.repository.UserLikeRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.repository.UserSaveRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class UserDiscoveryController {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final UserLikeRepository userLikeRepository;
    private final UserSaveRepository userSaveRepository;
    private final FestivalRepository festivalRepository;
    private final JwtUtil jwtUtil;

    public UserDiscoveryController(
            UserRepository userRepository,
            UserFollowRepository userFollowRepository,
            UserLikeRepository userLikeRepository,
            UserSaveRepository userSaveRepository,
            FestivalRepository festivalRepository,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.userFollowRepository = userFollowRepository;
        this.userLikeRepository = userLikeRepository;
        this.userSaveRepository = userSaveRepository;
        this.festivalRepository = festivalRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/api/users/discover")
    public List<UserDiscoveryResponse> discoverUsers(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "regions", required = false) List<String> regions,
            @RequestParam(value = "categories", required = false) List<String> categories,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String currentEmail = extractEmailOrNull(authHeader);
        String keyword = normalize(q);
        Set<String> regionKeywords = normalizeSet(regions);
        Set<String> categoryKeywords = normalizeSet(categories);

        Set<Long> mySavedFestivalIds = currentEmail == null
                ? Set.of()
                : userSaveRepository.findByUserEmailAndTargetType(currentEmail, "festival").stream()
                .map(UserSave::getTargetId)
                .collect(Collectors.toSet());
        Set<Long> myLikedFestivalIds = currentEmail == null
                ? Set.of()
                : userLikeRepository.findByUserEmailAndTargetType(currentEmail, "festival").stream()
                .map(UserLike::getTargetId)
                .collect(Collectors.toSet());

        Map<String, List<UserSave>> savesByEmail = userSaveRepository.findAll().stream()
                .filter(save -> "festival".equalsIgnoreCase(save.getTargetType()))
                .collect(Collectors.groupingBy(save -> save.getUserEmail().toLowerCase()));
        Map<String, List<UserLike>> likesByEmail = userLikeRepository.findAll().stream()
                .filter(like -> "festival".equalsIgnoreCase(like.getTargetType()))
                .collect(Collectors.groupingBy(like -> like.getUserEmail().toLowerCase()));

        Set<Long> savedFestivalIds = savesByEmail.values().stream()
                .flatMap(List::stream)
                .map(UserSave::getTargetId)
                .collect(Collectors.toSet());
        Set<Long> likedFestivalIds = likesByEmail.values().stream()
                .flatMap(List::stream)
                .map(UserLike::getTargetId)
                .collect(Collectors.toSet());
        savedFestivalIds.addAll(likedFestivalIds);

        Map<Long, Festival> festivalsById = festivalRepository.findAllById(savedFestivalIds).stream()
                .collect(Collectors.toMap(Festival::getId, Function.identity(), (first, second) -> first));

        return userRepository.findAll().stream()
                .filter(user -> currentEmail == null || !user.getEmail().equalsIgnoreCase(currentEmail))
                .filter(user -> matchesKeyword(user, keyword))
                .map(user -> buildResponse(
                        user,
                        currentEmail,
                        mySavedFestivalIds,
                        myLikedFestivalIds,
                        regionKeywords,
                        categoryKeywords,
                        savesByEmail,
                        likesByEmail,
                        festivalsById
                ))
                .sorted(Comparator
                        .comparingInt(UserDiscoveryResponse::getMatchScore).reversed()
                        .thenComparing(UserDiscoveryResponse::getNickname, Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(60)
                .toList();
    }

    private UserDiscoveryResponse buildResponse(
            User user,
            String currentEmail,
            Set<Long> mySavedFestivalIds,
            Set<Long> myLikedFestivalIds,
            Set<String> regionKeywords,
            Set<String> categoryKeywords,
            Map<String, List<UserSave>> savesByEmail,
            Map<String, List<UserLike>> likesByEmail,
            Map<Long, Festival> festivalsById
    ) {
        List<UserSave> saves = savesByEmail.getOrDefault(user.getEmail().toLowerCase(), List.of());
        List<UserLike> likes = likesByEmail.getOrDefault(user.getEmail().toLowerCase(), List.of());
        Set<Long> targetSavedIds = saves.stream()
                .map(UserSave::getTargetId)
                .collect(Collectors.toCollection(HashSet::new));
        Set<Long> targetLikedIds = likes.stream()
                .map(UserLike::getTargetId)
                .collect(Collectors.toCollection(HashSet::new));
        int overlapCount = (int) targetSavedIds.stream()
                .filter(mySavedFestivalIds::contains)
                .count();
        int likeOverlapCount = (int) targetLikedIds.stream()
                .filter(myLikedFestivalIds::contains)
                .count();
        Set<Long> targetInterestIds = new HashSet<>(targetSavedIds);
        targetInterestIds.addAll(targetLikedIds);
        List<Festival> savedFestivals = targetInterestIds.stream()
                .map(festivalsById::get)
                .filter(festival -> festival != null && festival.getTitle() != null && !festival.getTitle().isBlank())
                .distinct()
                .toList();

        int regionOverlapCount = countKeywordHits(savedFestivals, regionKeywords);
        int categoryOverlapCount = countKeywordHits(savedFestivals, categoryKeywords);
        List<String> matchReasons = buildMatchReasons(
                overlapCount,
                likeOverlapCount,
                regionOverlapCount,
                categoryOverlapCount,
                targetInterestIds.size(),
                currentEmail
        );

        List<SavedFestivalSummary> sampleFestivals = savedFestivals.stream()
                .sorted(Comparator.comparing((Festival festival) -> mySavedFestivalIds.contains(festival.getId())).reversed())
                .limit(3)
                .map(SavedFestivalSummary::new)
                .toList();

        boolean following = currentEmail != null
                && userFollowRepository.existsByFollowerEmailAndFollowingEmail(currentEmail, user.getEmail());
        boolean mutualFollow = following
                && userFollowRepository.existsByFollowerEmailAndFollowingEmail(user.getEmail(), currentEmail);

        return new UserDiscoveryResponse(
                user,
                userFollowRepository.countByFollowingEmail(user.getEmail()),
                userFollowRepository.countByFollowerEmail(user.getEmail()),
                following,
                mutualFollow,
                targetSavedIds.size(),
                overlapCount,
                likeOverlapCount,
                regionOverlapCount,
                categoryOverlapCount,
                matchReasons,
                sampleFestivals
        );
    }

    private boolean matchesKeyword(User user, String keyword) {
        if (keyword.isBlank()) {
            return true;
        }

        return normalize(user.getNickname()).contains(keyword)
                || normalize(user.getEmail()).contains(keyword);
    }

    private String normalize(String value) {
        return String.valueOf(value == null ? "" : value)
                .trim()
                .toLowerCase()
                .replaceAll("\\s+", "");
    }

    private Set<String> normalizeSet(List<String> values) {
        if (values == null) {
            return Set.of();
        }

        return values.stream()
                .flatMap(value -> List.of(String.valueOf(value).split(",")).stream())
                .map(this::normalize)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
    }

    private int countKeywordHits(List<Festival> festivals, Set<String> keywords) {
        if (keywords.isEmpty()) {
            return 0;
        }

        return (int) festivals.stream()
                .filter(festival -> {
                    String text = normalize(String.join(
                            " ",
                            String.valueOf(festival.getTitle()),
                            String.valueOf(festival.getRegion()),
                            String.valueOf(festival.getCategory()),
                            String.valueOf(festival.getLocation()),
                            String.valueOf(festival.getDescription())
                    ));
                    return keywords.stream().anyMatch(text::contains);
                })
                .count();
    }

    private List<String> buildMatchReasons(
            int overlapCount,
            int likeOverlapCount,
            int regionOverlapCount,
            int categoryOverlapCount,
            int interestCount,
            String currentEmail
    ) {
        List<String> reasons = new java.util.ArrayList<>();
        if (overlapCount > 0) reasons.add("저장한 행사가 " + overlapCount + "개 겹쳐요");
        if (likeOverlapCount > 0) reasons.add("좋아요한 행사가 " + likeOverlapCount + "개 겹쳐요");
        if (regionOverlapCount > 0) reasons.add("관심 지역과 맞는 저장 행사가 있어요");
        if (categoryOverlapCount > 0) reasons.add("선호 장르가 비슷해요");
        if (interestCount > 0) reasons.add("관심 문화행사를 살펴볼 만해요");
        if (currentEmail == null) reasons.add("로그인하면 내 취향 기준으로 더 정확해져요");
        if (reasons.isEmpty()) reasons.add("프로필 활동을 더 살펴볼 만해요");
        return reasons.stream().limit(3).toList();
    }

    private String extractEmailOrNull(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            return null;
        }
    }
}
