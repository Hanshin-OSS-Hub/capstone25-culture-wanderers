import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { authFetch } from "../api/authFetch";
import SavedFestivalCard from "../components/SavedFestivalCard";
import UserTrustBadge from "../components/UserTrustBadge";
import {
  BADGES_PER_PAGE,
  buildCultureBadges,
  getBadgeProgressSummary,
} from "../utils/cultureBadges";
import { addNotification, getDisplayName } from "../utils/notificationStorage";
import "./MyPage/MyPage.css";
import "./UserProfile.css";

const API_BASE = "http://localhost:8080";
const STORAGE_KEY = "loggedInUser";
const RANK_GUIDE = [
  { level: 1, emoji: "🐣", title: "구경러", range: "0 ~ 50점" },
  { level: 2, emoji: "🎫", title: "티켓 소지자", range: "51 ~ 150점" },
  { level: 3, emoji: "🎠", title: "놀이 시작", range: "151 ~ 300점" },
  { level: 4, emoji: "🎉", title: "파티 피플", range: "301 ~ 600점" },
  { level: 5, emoji: "🦁", title: "축제 왕", range: "601 ~ 1000점" },
  { level: 6, emoji: "👑", title: "축제 마스터", range: "1001점 이상" },
];

async function publicFetch(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`요청 실패: ${response.status}`);
  }
  return response.json();
}

function getCurrentEmail() {
  return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || "";
}

function getCurrentNickname() {
  return localStorage.getItem("nickname") || sessionStorage.getItem("nickname") || "";
}

function statusLabel(status) {
  const value = String(status || "").toUpperCase();
  if (value === "COMPLETED") return "파티 완료";
  if (value === "RECRUITING") return "모집 중";
  return "모집 마감";
}

function statusClass(status) {
  const value = String(status || "").toUpperCase();
  if (value === "COMPLETED") return "completed";
  if (value === "RECRUITING") return "recruiting";
  return "closed";
}

function safeArray(result) {
  return result.status === "fulfilled" && Array.isArray(result.value) ? result.value : [];
}

export default function UserProfile() {
  const { userEmail } = useParams();
  const navigate = useNavigate();
  const currentEmail = getCurrentEmail();
  const isMine = currentEmail && currentEmail.toLowerCase() === String(userEmail || "").toLowerCase();

  const [activeTab, setActiveTab] = useState("parties");
  const [badgePage, setBadgePage] = useState(0);
  const [parties, setParties] = useState([]);
  const [joinedParties, setJoinedParties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [savedFestivals, setSavedFestivals] = useState([]);
  const [journey, setJourney] = useState(null);
  const [userName, setUserName] = useState("");
  const [followStats, setFollowStats] = useState({
    followerCount: 0,
    followingCount: 0,
    following: false,
  });
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState(null);
  const [showRankGuide, setShowRankGuide] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const encodedUserEmail = encodeURIComponent(userEmail);
        const [partiesResult, reviewsResult, postsResult, savedResult, journeyResult, rankResult] =
          await Promise.allSettled([
            publicFetch(`/api/users/${encodedUserEmail}/parties`),
            publicFetch(`/api/users/${encodedUserEmail}/reviews`),
            publicFetch(`/api/users/${encodedUserEmail}/posts`),
            publicFetch(`/api/users/${encodedUserEmail}/saved-festivals`),
            publicFetch(`/api/users/${encodedUserEmail}/journey`),
            publicFetch(`/api/users/${encodedUserEmail}/rank`),
          ]);

        const safeParties = safeArray(partiesResult);
        const safeReviews = safeArray(reviewsResult);
        const safePosts = safeArray(postsResult);
        const safeSaved = safeArray(savedResult);

        setParties(safeParties);
        setReviews(safeReviews);
        setPosts(safePosts);
        setSavedFestivals(safeSaved);
        setJourney(journeyResult.status === "fulfilled" ? journeyResult.value : null);
        if (rankResult.status === "fulfilled") {
          setRank(rankResult.value);
        }

        if (isMine) {
          try {
            const myParties = await authFetch("/api/me/parties");
            setJoinedParties(Array.isArray(myParties) ? myParties : []);
          } catch {
            setJoinedParties([]);
          }
        } else {
          setJoinedParties([]);
        }

        try {
          const statsData = await authFetch(`/api/users/${encodedUserEmail}/follow-stats`);
          setFollowStats({
            followerCount: statsData?.followerCount || 0,
            followingCount: statsData?.followingCount || 0,
            following: Boolean(statsData?.following),
          });
        } catch {
          const statsData = await publicFetch(`/api/users/${encodedUserEmail}/follow-stats`);
          setFollowStats({
            followerCount: statsData?.followerCount || 0,
            followingCount: statsData?.followingCount || 0,
            following: false,
          });
        }

        const firstParty = safeParties[0];
        const firstReview = safeReviews[0];
        const firstPost = safePosts[0];
        setUserName(
          firstParty?.authorNickname ||
            firstReview?.authorNickname ||
            firstPost?.authorNickname ||
            String(userEmail || "").split("@")[0] ||
            "사용자"
        );
      } catch (error) {
        console.error("사용자 프로필 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userEmail, isMine]);

  const festivalReviews = useMemo(
    () => reviews.filter((review) => String(review.targetType || "").toLowerCase() === "festival"),
    [reviews]
  );

  const profileStats = useMemo(
    () => ({
      reviews: reviews.length,
      partyPosts: parties.length,
      joinedParties: joinedParties.length,
      likedEvents: 0,
      savedEvents: savedFestivals.length,
    }),
    [joinedParties.length, parties.length, reviews.length, savedFestivals.length]
  );

  const profileBadges = buildCultureBadges(journey, profileStats);
  const { unlockedCount: unlockedBadgeCount } = getBadgeProgressSummary(profileBadges);
  const earnedBadges = profileBadges.filter((badge) => badge.unlocked);

  const handleToggleFollow = async () => {
    if (isMine) {
      alert("본인은 팔로우할 수 없어요.");
      return;
    }

    setFollowLoading(true);
    try {
      const method = followStats.following ? "DELETE" : "POST";
      const wasFollowing = followStats.following;
      const data = await authFetch(`/api/users/${encodeURIComponent(userEmail)}/follow`, { method });
      setFollowStats({
        followerCount: data?.followerCount || 0,
        followingCount: data?.followingCount || 0,
        following: Boolean(data?.following),
      });

      if (!wasFollowing && Boolean(data?.following)) {
        const followerName = getDisplayName({
          email: currentEmail,
          nickname: getCurrentNickname(),
        });

        addNotification(userEmail, {
          type: "followed",
          title: "새 팔로워",
          message: `${followerName}님이 팔로우했어요.`,
          followerEmail: currentEmail,
          followerName,
          actionLabel: "프로필 보기",
          path: `/profile/${encodeURIComponent(currentEmail)}`,
        });
      }
    } catch (error) {
      console.error("팔로우 처리 실패:", error);
      alert("로그인 후 이용할 수 있어요.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">프로필을 불러오는 중이에요.</div>;
  }

  const tabs = [
    { key: "badges", label: `문화 배지 (${unlockedBadgeCount}/${profileBadges.length})` },
    { key: "parties", label: `파티 모집글 (${parties.length})` },
    ...(isMine ? [{ key: "joinedParties", label: `내가 신청한 파티 (${joinedParties.length})` }] : []),
    { key: "festivalReviews", label: `축제 후기 (${festivalReviews.length})` },
    { key: "posts", label: `커뮤니티 글 (${posts.length})` },
    { key: "saved", label: `저장한 축제 (${savedFestivals.length})` },
  ];

  return (
    <div className="profile-page">
      <button type="button" className="profile-back-btn" onClick={() => navigate(-1)}>
        ← 돌아가기
      </button>

      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{userName || "사용자"}</h1>
            <UserTrustBadge email={userEmail} />
          </div>
          {rank && (
            <button
              type="button"
              className="profile-rank-row profile-rank-inline"
              onClick={() => setShowRankGuide(true)}
              aria-label="활동등급표 보기"
            >
              <span className="rank-kind">활동등급</span>
              <span className="rank-emoji">{rank.rankEmoji}</span>
              <span className="rank-title">{rank.rankTitle}</span>
              <span className="rank-level">Lv.{rank.level}</span>
              <span className="rank-points">{rank.points?.toFixed(1) || 0}점</span>
            </button>
          )}
          <div className="profile-follow-row">
            <span>팔로워 {followStats.followerCount}</span>
            <span>팔로잉 {followStats.followingCount}</span>
            <button type="button" onClick={handleToggleFollow} disabled={followLoading || isMine}>
              {isMine ? "내 프로필" : followLoading ? "처리 중..." : followStats.following ? "팔로우 취소" : "팔로우"}
            </button>
          </div>
        </div>

        <div className="profile-earned-badges" aria-label="획득한 문화 배지">
          <div className="profile-earned-title">획득 배지</div>
          {earnedBadges.length > 0 ? (
            <div className="profile-earned-list">
              {earnedBadges.slice(0, 6).map((badge) => (
                <div
                  key={badge.id}
                  className={`profile-earned-badge tier-${badge.level}`}
                  title={`${badge.name} · ${badge.tierLabel}`}
                >
                  <div className={`visit-badge-mark badge-${badge.visual || "stamp"}`}>
                    <span />
                  </div>
                  <span>{badge.name}</span>
                </div>
              ))}
              {earnedBadges.length > 6 && (
                <div className="profile-earned-more">+{earnedBadges.length - 6}</div>
              )}
            </div>
          ) : (
            <div className="profile-earned-empty">아직 획득한 배지가 없어요.</div>
          )}
        </div>
      </div>

      {showRankGuide && rank && (
        <div className="rank-guide-backdrop" onClick={() => setShowRankGuide(false)}>
          <div className="rank-guide-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="rank-guide-header">
              <div>
                <div className="rank-guide-title">활동등급표</div>
                <div className="rank-guide-subtitle">리뷰, 댓글, 파티 활동이 쌓이면 등급이 올라가요.</div>
              </div>
              <button type="button" className="rank-guide-close" onClick={() => setShowRankGuide(false)} aria-label="닫기">
                ×
              </button>
            </div>
            <div className="rank-guide-current">
              현재 활동등급 {rank.rankTitle} Lv.{rank.level} · {rank.points?.toFixed(1) || 0}점
            </div>
            <div className="rank-guide-list">
              {RANK_GUIDE.map((item) => (
                <div
                  key={item.level}
                  className={`rank-guide-item ${Number(rank.level) === item.level ? "current" : ""}`}
                >
                  <span className="rank-guide-emoji">{item.emoji}</span>
                  <span className="rank-guide-name">{item.title}</span>
                  <span className="rank-guide-level">Lv.{item.level}</span>
                  <span className="rank-guide-range">{item.range}</span>
                </div>
              ))}
            </div>
            {rank.nextRankTitle ? (
              <div className="rank-guide-next">
                다음 등급 {rank.nextRankTitle}까지 {(rank.nextRankMin - rank.points).toFixed(1)}점 남았어요.
              </div>
            ) : (
              <div className="rank-guide-next">최고 등급을 달성했어요.</div>
            )}
          </div>
        </div>
      )}

      <div className="profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`profile-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="profile-content">
        {activeTab === "badges" && (
          <ProfileBadgeBoard
            badges={profileBadges}
            badgePage={badgePage}
            setBadgePage={setBadgePage}
            userName={userName || "사용자"}
          />
        )}

        {activeTab === "parties" && (
          <ProfilePartyList
            parties={parties}
            emptyText="작성한 파티 모집글이 없어요."
            navigate={navigate}
          />
        )}

        {activeTab === "joinedParties" && (
          <ProfilePartyList
            parties={joinedParties}
            emptyText="신청하거나 참여한 파티가 없어요."
            navigate={navigate}
          />
        )}

        {activeTab === "festivalReviews" && (
          <div className="profile-section">
            {festivalReviews.length === 0 ? (
              <p className="profile-empty">작성한 축제 후기가 없어요.</p>
            ) : (
              <div className="profile-list">
                {festivalReviews.map((review) => (
                  <div
                    key={review.id}
                    className="profile-card review-card"
                    onClick={() => navigate(`/community/review/${review.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="profile-card-title">{review.title}</div>
                    <div className="profile-card-meta">
                      <span>대상 {review.targetTitle || "-"}</span>
                    </div>
                    <div className="profile-card-rating">{"★".repeat(review.rating || 0)}</div>
                    <p className="profile-card-content">{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="profile-section">
            {posts.length === 0 ? (
              <p className="profile-empty">작성한 커뮤니티 글이 없어요.</p>
            ) : (
              <div className="profile-list">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="profile-card post-card"
                    onClick={() => navigate(`/community/${String(post.type || "free").toLowerCase()}/${post.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="profile-card-type">
                      {post.type === "QUESTION" ? "질문" : post.type === "REVIEW" ? "리뷰" : "자유"}
                    </div>
                    <div className="profile-card-title">{post.title}</div>
                    <div className="profile-card-meta">
                      <span>조회 {post.viewCount || 0}</span>
                      <span>댓글 {post.commentCount || 0}</span>
                    </div>
                    <p className="profile-card-content">{String(post.content || "").slice(0, 100)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="profile-section">
            {savedFestivals.length === 0 ? (
              <p className="profile-empty">저장한 축제가 없어요.</p>
            ) : (
              <div className="saved-festival-list">
                {savedFestivals.map((festival) => (
                  <SavedFestivalCard
                    key={festival.id}
                    festival={festival}
                    onClick={() => navigate(`/detail/${festival.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileBadgeBoard({ badges, badgePage, setBadgePage, userName }) {
  const {
    unlockedCount,
    collectionRate,
    topPercent,
    nextBadge,
  } = getBadgeProgressSummary(badges);
  const badgePageCount = Math.max(1, Math.ceil(badges.length / BADGES_PER_PAGE));
  const safeBadgePage = Math.min(badgePage, badgePageCount - 1);
  const visibleBadges = badges.slice(
    safeBadgePage * BADGES_PER_PAGE,
    safeBadgePage * BADGES_PER_PAGE + BADGES_PER_PAGE
  );

  return (
    <div className="visit-badge-card profile-badge-card">
      <div className="visit-badge-header">
        <div>
          <div className="visit-badge-title">{userName}님의 문화 배지</div>
          <div className="visit-badge-subtitle">
            방문, 리뷰, 저장, 동행 기록에 따라 3단계로 성장하는 배지예요.
          </div>
        </div>
        <div className="visit-badge-summary">
          {unlockedCount}/{badges.length}
        </div>
      </div>

      {nextBadge && (
        <div className="next-badge-hint">
          <span>수집률 {collectionRate}% · 수집 기준 상위 {topPercent}%</span>
          <span>
            다음 추천 배지 <strong>{nextBadge.nextName}</strong>까지{" "}
            {Math.max(nextBadge.goal - nextBadge.rawProgress, 0)}개 남았어요.
          </span>
        </div>
      )}

      <div className="visit-badge-grid">
        {visibleBadges.map((badge) => (
          <div
            key={badge.id}
            className={`visit-badge-item ${badge.unlocked ? "unlocked" : ""} tier-${badge.level}`}
          >
            <div className={`visit-badge-mark badge-${badge.visual || "stamp"}`}>
              <span />
            </div>
            <div className="visit-badge-copy">
              <div className="visit-badge-tier">{badge.tierLabel}</div>
              <div className="visit-badge-name">{badge.name}</div>
              <div className="visit-badge-desc">
                {badge.isMaxed
                  ? `${badge.desc} 최고 단계 달성`
                  : `${badge.desc} ${badge.goal}${badge.unit || "회"}`}
              </div>
              <div className="visit-badge-progress">
                <span style={{ width: `${Math.min(100, (badge.progress / badge.goal) * 100)}%` }} />
              </div>
              <div className="visit-badge-count">
                {badge.rawProgress}/{badge.goal}
              </div>
            </div>
          </div>
        ))}
      </div>

      {badgePageCount > 1 && (
        <div className="badge-pager">
          <button
            type="button"
            onClick={() => setBadgePage((page) => Math.max(0, page - 1))}
            disabled={safeBadgePage === 0}
          >
            이전
          </button>
          <span>
            {safeBadgePage + 1} / {badgePageCount}
          </span>
          <button
            type="button"
            onClick={() => setBadgePage((page) => Math.min(badgePageCount - 1, page + 1))}
            disabled={safeBadgePage >= badgePageCount - 1}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

function ProfilePartyList({ parties, emptyText, navigate }) {
  return (
    <div className="profile-section">
      {parties.length === 0 ? (
        <p className="profile-empty">{emptyText}</p>
      ) : (
        <div className="profile-list">
          {parties.map((party) => (
            <div
              key={party.id}
              className="profile-card party-card"
              onClick={() => navigate(`/party/${party.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="profile-card-title">{party.title}</div>
              <div className="profile-card-meta">
                <span>축제 {party.festivalTitle || "정보 없음"}</span>
                <span>
                  일정 {party.meetingTime ? String(party.meetingTime).replace("T", " ").slice(0, 16) : "미정"}
                </span>
                <span>장소 {party.location || "미정"}</span>
              </div>
              <div className={`profile-card-status ${statusClass(party.status)}`}>
                {statusLabel(party.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
