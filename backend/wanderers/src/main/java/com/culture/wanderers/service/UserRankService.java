package com.culture.wanderers.service;

import com.culture.wanderers.entity.User;
import com.culture.wanderers.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class UserRankService {

    private final UserRepository userRepository;

    public UserRankService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void addPoints(String userEmail, double delta) {
        if (userEmail == null || userEmail.isBlank() || delta <= 0) {
            return;
        }

        userRepository.findByEmail(userEmail).ifPresent(user -> {
            double current = safePoints(user.getTrustPoints());
            double updated = roundOneDecimal(current + delta);
            user.setTrustPoints(updated);

            RankInfo rank = resolveRank(updated);
            user.setLevel(rank.level());
            user.setRankEmoji(rank.emoji());
            user.setRankTitle(rank.title());
            userRepository.save(user);
        });
    }

    public User decorateUser(User user) {
        if (user == null) {
            return null;
        }

        double points = safePoints(user.getTrustPoints());
        user.setTrustPoints(points);

        RankInfo rank = resolveRank(points);
        user.setLevel(rank.level());
        user.setRankEmoji(rank.emoji());
        user.setRankTitle(rank.title());
        return user;
    }

    public Map<String, Object> buildRankResponse(User user) {
        User decorated = decorateUser(user);
        RankInfo rank = resolveRank(safePoints(decorated.getTrustPoints()));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", decorated.getEmail());
        body.put("points", decorated.getTrustPoints());
        body.put("level", rank.level());
        body.put("rankEmoji", rank.emoji());
        body.put("rankTitle", rank.title());
        body.put("nextRankMin", rank.nextMin());
        body.put("nextRankTitle", rank.nextTitle());
        return body;
    }

    public double pointsForComment(String targetType) {
        if ("REVIEW".equalsIgnoreCase(targetType) || "PARTY".equalsIgnoreCase(targetType)) {
            return 0.5;
        }
        return 0.3;
    }

    public double pointsForReviewLike(String reviewTargetType) {
        if ("party".equalsIgnoreCase(reviewTargetType)) {
            return 5.0;
        }
        return 3.0;
    }

    private double safePoints(Double points) {
        return points == null ? 0.0 : points;
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    public RankInfo resolveRank(double points) {
        if (points <= 50.0) {
            return new RankInfo(1, "🐣", "구경러", 51, "티켓 소지자");
        }
        if (points <= 150.0) {
            return new RankInfo(2, "🎫", "티켓 소지자", 151, "놀이 시작");
        }
        if (points <= 300.0) {
            return new RankInfo(3, "🎠", "놀이 시작", 301, "파티 피플");
        }
        if (points <= 600.0) {
            return new RankInfo(4, "🎉", "파티 피플", 601, "축제 왕");
        }
        if (points <= 1000.0) {
            return new RankInfo(5, "🦁", "축제 왕", 1001, "축제 마스터");
        }
        return new RankInfo(6, "👑", "축제 마스터", null, null);
    }

    public record RankInfo(int level, String emoji, String title, Integer nextMin, String nextTitle) {
    }
}
