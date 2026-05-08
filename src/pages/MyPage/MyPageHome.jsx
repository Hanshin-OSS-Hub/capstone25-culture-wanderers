import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import { useAuth } from "../../auth/AuthContext";
import { getLikedFestivals } from "../../utils/likeStorage";
import { getSavedFestivals } from "../../utils/saveStorage";
import {
  BADGES_PER_PAGE,
  buildCultureBadges,
  getBadgeProgressSummary,
} from "../../utils/cultureBadges";
import {
  addCompanionChatMessage,
  createCompanionRequestId,
  getCompanionChatMessages,
  getWeekdayLabels,
  WEEKDAY_OPTIONS,
} from "../../utils/companionRequestStorage";
import {
  getDeadlineNotificationSettings,
  saveDeadlineNotificationSettings,
} from "../../utils/deadlineNotificationSettings";
import { addNotification, getDisplayName } from "../../utils/notificationStorage";
import "./MyPage.css";
import "./Preference.css";

const REGION_OPTIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const CATEGORY_OPTIONS = [
  "축제",
  "전시",
  "전시회",
  "공연",
  "미술관",
  "박물관",
  "페스티벌",
  "먹거리",
  "원데이",
  "체험",
  "플리마켓",
];

const keepSelectableValues = (values, options) =>
  (Array.isArray(values) ? values : []).filter((value) => options.includes(value));

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const getFestivalText = (festival) =>
  [
    festival?.title,
    festival?.category,
    festival?.region,
    festival?.location,
    festival?.description,
  ].join(" ");

const countMatchingValues = (source, values) => {
  const normalizedSource = normalizeText(source);
  return values.filter((value) => normalizedSource.includes(normalizeText(value))).length;
};

const formatShortDate = (value) => {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
  }
  return raw.split("T")[0].replaceAll("-", ".");
};

const normalizeDiscoveryUser = (item) => ({
  email: item.email || "",
  nickname: item.nickname || item.email?.split("@")[0] || "사용자",
  following: Boolean(item.following),
  mutualFollow: Boolean(item.mutualFollow),
  followerCount: item.followerCount ?? 0,
  followingCount: item.followingCount ?? 0,
  savedFestivalCount: item.savedFestivalCount ?? 0,
  overlapCount: item.overlapCount ?? 0,
  likeOverlapCount: item.likeOverlapCount ?? 0,
  regionOverlapCount: item.regionOverlapCount ?? 0,
  categoryOverlapCount: item.categoryOverlapCount ?? 0,
  matchScore: item.matchScore ?? 0,
  matchReasons: Array.isArray(item.matchReasons) ? item.matchReasons : [],
  sampleSavedFestivals: Array.isArray(item.sampleSavedFestivals)
    ? item.sampleSavedFestivals
    : [],
  sampleSavedFestivalTitles: Array.isArray(item.sampleSavedFestivalTitles)
    ? item.sampleSavedFestivalTitles
    : [],
});

const buildCompanionOverlap = (items, selectedRegions, selectedCategories) => {
  const grouped = new Map();
  const regions = keepSelectableValues(selectedRegions, REGION_OPTIONS);
  const categories = keepSelectableValues(selectedCategories, CATEGORY_OPTIONS);

  (Array.isArray(items) ? items : []).forEach((festival) => {
    const email = String(festival.savedByEmail || "").trim().toLowerCase();
    if (!email) return;

    const current = grouped.get(email) || {
      email,
      nickname: festival.savedByNickname || email.split("@")[0],
      festivals: [],
      regionHits: 0,
      categoryHits: 0,
    };

    const text = getFestivalText(festival);
    current.festivals.push(festival);
    current.regionHits += countMatchingValues(text, regions);
    current.categoryHits += countMatchingValues(text, categories);
    grouped.set(email, current);
  });

  return Array.from(grouped.values())
    .map((item) => {
      const score = Math.min(
        98,
        48 + item.festivals.length * 8 + item.regionHits * 12 + item.categoryHits * 14
      );
      const reasons = [];
      if (item.regionHits > 0) reasons.push("관심 지역이 겹쳐요");
      if (item.categoryHits > 0) reasons.push("선호 장르가 비슷해요");
      if (item.festivals.length > 1) reasons.push("저장한 행사가 여러 개 겹쳐요");
      if (reasons.length === 0) reasons.push("팔로우 기반으로 살펴볼 만해요");

      return {
        ...item,
        score,
        reasons: reasons.slice(0, 3),
        sampleFestival: item.festivals[0],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

export default function MyPageHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const nickname = useMemo(() => {
    if (user?.nickname) return user.nickname;
    if (user?.email) return user.email.split("@")[0];
    return "사용자";
  }, [user]);

  const [stats, setStats] = useState({
    reviews: 0,
    partyPosts: 0,
    joinedParties: 0,
    likedEvents: 0,
    savedEvents: 0,
  });
  const [preference, setPreference] = useState(null);
  const [journey, setJourney] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [savingPreference, setSavingPreference] = useState(false);
  const [followingSavedFestivals, setFollowingSavedFestivals] = useState([]);
  const [discoveredUsers, setDiscoveredUsers] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [companionRequestTarget, setCompanionRequestTarget] = useState(null);
  const [requestWeekdays, setRequestWeekdays] = useState(["sat"]);
  const [requestMessage, setRequestMessage] = useState("");
  const [chatTarget, setChatTarget] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [showAllFollowingSaves, setShowAllFollowingSaves] = useState(false);
  const [deadlineSettings, setDeadlineSettings] = useState(() =>
    getDeadlineNotificationSettings(user?.email)
  );
  const [badgePage, setBadgePage] = useState(0);
  const [rank, setRank] = useState(null);

  useEffect(() => {
    const safeCount = (result) => {
      if (result.status !== "fulfilled") return 0;
      const data = result.value;
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.data)) return data.data.length;
      return 0;
    };

    const fetchPageData = async () => {
      const [
        reviews,
        partyPosts,
        joinedParties,
        likes,
        saves,
        journeyResult,
        preferenceResult,
        followingSavesResult,
        rankResult,
      ] =
        await Promise.allSettled([
          authFetch("/api/me/reviews"),
          authFetch("/api/me/party-posts"),
          authFetch("/api/me/parties"),
          authFetch("/api/me/likes"),
          authFetch("/api/me/saves"),
          authFetch("/api/me/journey"),
          authFetch("/api/recommend/preferences"),
          authFetch("/api/me/following-saved-festivals"),
          authFetch("/api/me/rank"),
        ]);

      const localLikedCount = getLikedFestivals().length;
      const remoteLikedCount =
        likes.status === "fulfilled" && Array.isArray(likes.value)
          ? likes.value.filter((item) => String(item.targetType || "").toLowerCase() === "festival").length
          : 0;
      const localSavedCount = getSavedFestivals().length;
      const remoteSavedCount =
        saves.status === "fulfilled" && Array.isArray(saves.value)
          ? saves.value.filter((item) => String(item.targetType || "").toLowerCase() === "festival").length
          : 0;

      setStats({
        reviews: safeCount(reviews),
        partyPosts: safeCount(partyPosts),
        joinedParties: safeCount(joinedParties),
        likedEvents: likes.status === "fulfilled" ? remoteLikedCount : localLikedCount,
        savedEvents: saves.status === "fulfilled" ? remoteSavedCount : localSavedCount,
      });

      setJourney(journeyResult.status === "fulfilled" ? journeyResult.value : null);

      if (preferenceResult.status === "fulfilled") {
        const data = preferenceResult.value;
        setPreference(data);
        setSelectedRegions(keepSelectableValues(data?.selectedRegions, REGION_OPTIONS));
        setSelectedCategories(keepSelectableValues(data?.selectedCategories, CATEGORY_OPTIONS));
      } else {
        setPreference(null);
      }

      setFollowingSavedFestivals(
        followingSavesResult.status === "fulfilled" && Array.isArray(followingSavesResult.value)
          ? followingSavesResult.value
          : []
      );

      if (rankResult.status === "fulfilled") {
        setRank(rankResult.value);
      }
    };

    fetchPageData();
  }, []);

  useEffect(() => {
    setDeadlineSettings(getDeadlineNotificationSettings(user?.email));
  }, [user?.email]);

  useEffect(() => {
    const fetchDiscovery = async () => {
      setDiscoverLoading(true);
      try {
        const params = new URLSearchParams();
        keepSelectableValues(selectedRegions, REGION_OPTIONS).forEach((region) =>
          params.append("regions", region)
        );
        keepSelectableValues(selectedCategories, CATEGORY_OPTIONS).forEach((category) =>
          params.append("categories", category)
        );
        const query = params.toString();
        const data = await authFetch(`/api/users/discover${query ? `?${query}` : ""}`);
        setDiscoveredUsers(Array.isArray(data) ? data.map(normalizeDiscoveryUser).slice(0, 6) : []);
      } catch (error) {
        console.error("취향 친구 추천 로딩 실패:", error);
        setDiscoveredUsers([]);
      } finally {
        setDiscoverLoading(false);
      }
    };

    fetchDiscovery();
  }, [selectedRegions, selectedCategories]);

  useEffect(() => {
    const syncLikedCount = () => {
      setStats((prev) => ({
        ...prev,
        likedEvents: getLikedFestivals().length,
      }));
    };
    const syncSavedCount = () => {
      setStats((prev) => ({
        ...prev,
        savedEvents: getSavedFestivals().length,
      }));
    };

    window.addEventListener("festival-likes-changed", syncLikedCount);
    window.addEventListener("festival-saves-changed", syncSavedCount);
    window.addEventListener("storage", syncLikedCount);
    window.addEventListener("storage", syncSavedCount);

    return () => {
      window.removeEventListener("festival-likes-changed", syncLikedCount);
      window.removeEventListener("festival-saves-changed", syncSavedCount);
      window.removeEventListener("storage", syncLikedCount);
      window.removeEventListener("storage", syncSavedCount);
    };
  }, []);

  const toggleRegion = (value) => {
    setSelectedRegions((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const savePreferenceSelection = async () => {
    const nextRegions = keepSelectableValues(selectedRegions, REGION_OPTIONS);
    const nextCategories = keepSelectableValues(selectedCategories, CATEGORY_OPTIONS);

    setSavingPreference(true);
    try {
      const data = await authFetch("/api/recommend/preferences/selection", {
        method: "PUT",
        body: JSON.stringify({
          regions: nextRegions,
          categories: nextCategories,
        }),
      });

      setPreference(data);
      setSelectedRegions(keepSelectableValues(data?.selectedRegions, REGION_OPTIONS));
      setSelectedCategories(keepSelectableValues(data?.selectedCategories, CATEGORY_OPTIONS));
      alert("관심사가 저장되었어요.");
    } catch (error) {
      console.error("관심사 저장 실패:", error);
      alert("관심사 저장에 실패했어요.");
    } finally {
      setSavingPreference(false);
    }
  };

  const selectedSummary = [
    ...keepSelectableValues(selectedRegions, REGION_OPTIONS),
    ...keepSelectableValues(selectedCategories, CATEGORY_OPTIONS),
  ];
  const visitBadges = buildCultureBadges(journey, stats);
  const {
    unlockedCount: unlockedBadgeCount,
    collectionRate: badgeCollectionRate,
    topPercent: badgeTopPercent,
    nextBadge,
  } = getBadgeProgressSummary(visitBadges);
  const badgePageCount = Math.max(1, Math.ceil(visitBadges.length / BADGES_PER_PAGE));
  const safeBadgePage = Math.min(badgePage, badgePageCount - 1);
  const visibleBadges = visitBadges.slice(
    safeBadgePage * BADGES_PER_PAGE,
    safeBadgePage * BADGES_PER_PAGE + BADGES_PER_PAGE
  );
  const companionMatches = buildCompanionOverlap(
    followingSavedFestivals,
    selectedRegions,
    selectedCategories
  );
  const recommendedCompanions = discoveredUsers.length > 0 ? discoveredUsers : companionMatches;
  const followingSaveUserCount = new Set(
    followingSavedFestivals.map((festival) => String(festival.savedByEmail || "").trim()).filter(Boolean)
  ).size;
  const visibleFollowingSaves = showAllFollowingSaves
    ? followingSavedFestivals.slice(0, 8)
    : followingSavedFestivals.slice(0, 3);
  const interestCount = selectedSummary.length;
  const topFestivalForParty = (match) =>
    match.sampleSavedFestivals?.[0] ||
    match.sampleFestival ||
    null;

  const getFollowLabel = (match) => {
    if (match.mutualFollow) return "서로 팔로우";
    if (match.following) return "내가 팔로우 중";
    return "팔로우 전 추천";
  };

  const getCompanionChatId = (match) => {
    const festival = topFestivalForParty(match);
    return [
      "companion-chat",
      String(user?.email || "").trim().toLowerCase(),
      String(match?.email || "").trim().toLowerCase(),
      String(festival?.id || festival?.festivalId || festival?.title || "event"),
    ]
      .filter(Boolean)
      .join("|");
  };

  const closeCompanionRequest = () => {
    setCompanionRequestTarget(null);
    setRequestWeekdays(["sat"]);
    setRequestMessage("");
  };

  const toggleRequestWeekday = (key) => {
    setRequestWeekdays((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
      return next.length > 0 ? next : prev;
    });
  };

  const sendCompanionRequest = () => {
    const match = companionRequestTarget;
    const festival = topFestivalForParty(match);
    if (!match?.email || !festival) return;

    const requesterEmail = user?.email || "";
    const requesterName = getDisplayName({
      email: requesterEmail,
      nickname,
    });
    const requestId = createCompanionRequestId();
    const chatId = getCompanionChatId(match);
    const event = {
      title: festival.title || festival.festivalTitle || "문화행사",
      location: [festival.region, festival.location].filter(Boolean).join(" ").trim(),
      festivalId: festival.id || festival.festivalId || null,
      festivalPeriod: festival.startDate && festival.endDate ? `${festival.startDate} - ${festival.endDate}` : "",
    };
    const message = requestMessage.trim() || "같이 가고 싶어서 동행 요청을 보냈어요.";

    addCompanionChatMessage(chatId, {
      senderEmail: requesterEmail,
      senderName: requesterName,
      text: message,
    });

    addNotification(match.email, {
      type: "companion-request",
      requestId,
      chatId,
      title: "동행 요청이 도착했어요.",
      message: `${requesterName}님이 "${event.title}" 동행요청을 했어요. 수락하시겠어요?`,
      actionLabel: "수락 / 거절",
      inviteStatus: "pending",
      requesterEmail,
      requesterName,
      targetEmail: match.email,
      targetName: match.nickname,
      weekdays: requestWeekdays,
      event,
    });

    alert(`${match.nickname}님에게 동행 요청을 보냈어요.`);
    closeCompanionRequest();
  };

  const openCompanionChat = (match) => {
    const chatId = getCompanionChatId(match);
    setChatTarget({ ...match, chatId });
    setChatMessages(getCompanionChatMessages(chatId));
    setChatText("");
  };

  const closeCompanionChat = () => {
    setChatTarget(null);
    setChatMessages([]);
    setChatText("");
  };

  const sendCompanionChat = () => {
    if (!chatTarget?.chatId || !chatText.trim()) return;

    const next = addCompanionChatMessage(chatTarget.chatId, {
      senderEmail: user?.email || "",
      senderName: nickname,
      text: chatText.trim(),
    });
    setChatMessages(next);
    setChatText("");
  };

  const categoryStats = Array.isArray(journey?.categoryStats) ? journey.categoryStats : [];
  const regionStats = Array.isArray(journey?.regionStats) ? journey.regionStats : [];
  const maxCategoryCount = Math.max(...categoryStats.map((item) => Number(item.count || 0)), 1);

  const updateDeadlineSettings = (patch) => {
    const next = saveDeadlineNotificationSettings(user?.email, {
      ...deadlineSettings,
      ...patch,
    });
    setDeadlineSettings(next);
  };

  return (
    <section className="mypage-main">
      <div className="mypage-main-panel">
        <h2 className="mypage-section-title">내 정보</h2>

        <div className="mypage-info-card">
          <div className="mypage-info-left">
            <div className="mypage-info-icon">수</div>
            <div className="mypage-info-text-group">
              <div className="mypage-info-name">{nickname}님</div>
              <div className="mypage-info-greeting">
                오늘도 문화생활, 가볍게 한 번 떠나볼까요?
              </div>
              <div className="mypage-info-details">
                <div className="mypage-info-item">
                  <span className="label">이메일</span>
                  <span className="value">{user?.email || "-"}</span>
                </div>
                <div className="mypage-info-item">
                  <span className="label">닉네임</span>
                  <span className="value">{nickname}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 등급 정보 카드 */}
        {rank && (
          <div className="mypage-rank-card">
            <div className="rank-badge">
              <div className="rank-emoji">{rank.rankEmoji}</div>
              <div className="rank-info">
                <div className="rank-title">{rank.rankTitle}</div>
                <div className="rank-level">Lv.{rank.level}</div>
              </div>
            </div>
            <div className="rank-details">
              <div className="points-display">
                <span className="points-label">신뢰 점수</span>
                <span className="points-value">{rank.points?.toFixed(1) || 0}점</span>
              </div>
              {rank.nextRankTitle && (
                <div className="progress-section">
                  <div className="progress-label">
                    다음 등급: {rank.nextRankTitle} (
                    {rank.nextRankMin}점까지 {(rank.nextRankMin - rank.points).toFixed(1)}점 남음)
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.min(100, Math.max(0, ((rank.points - (rank.level === 1 ? 0 : (rank.level === 2 ? 51 : rank.level === 3 ? 151 : rank.level === 4 ? 301 : rank.level === 5 ? 601 : 1001))) / (rank.nextRankMin - (rank.level === 1 ? 0 : (rank.level === 2 ? 51 : rank.level === 3 ? 151 : rank.level === 4 ? 301 : rank.level === 5 ? 601 : 1001)))) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mypage-preference-card">
          <div className="preference-card-header">
            <div>
              <div className="preference-title">내 취향 분석</div>
              <div className="preference-subtitle">
                검색, 상세조회, 좋아요, 방문 기록과 직접 선택한 관심사를 함께 반영했어요.
              </div>
            </div>
            <button
              type="button"
              className="mypage-main-edit-btn"
              onClick={() => navigate("/result?personalized=1&limit=10")}
            >
              추천 보러가기
            </button>
          </div>

          <div className="preference-grid">
            <div className="preference-item">
              <span className="label">관심 지역</span>
              <span className="value">{preference?.topRegion || "아직 없어요"}</span>
            </div>
            <div className="preference-item">
              <span className="label">관심 카테고리</span>
              <span className="value">{preference?.topCategory || "아직 없어요"}</span>
            </div>
            <div className="preference-item wide">
              <span className="label">자주 본 키워드</span>
              <span className="value">
                {preference?.topKeywords?.length
                  ? preference.topKeywords.join(", ")
                  : "아직 없어요"}
              </span>
            </div>
            <div className="preference-item wide">
              <span className="label">직접 선택한 관심사</span>
              <div className="preference-tag-list">
                {selectedSummary.length > 0 ? (
                  selectedSummary.map((item) => (
                    <span key={item} className="preference-tag active">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="preference-tag muted">아직 선택한 관심사가 없어요.</span>
                )}
              </div>
            </div>
          </div>

          <div className="preference-editor">
            <div className="preference-editor-group">
              <div className="preference-editor-title">관심 지역 선택</div>
              <div className="preference-chip-wrap">
                {REGION_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`preference-chip ${selectedRegions.includes(item) ? "active" : ""}`}
                    onClick={() => toggleRegion(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="preference-editor-group">
              <div className="preference-editor-title">관심 카테고리 선택</div>
              <div className="preference-chip-wrap">
                {CATEGORY_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`preference-chip ${selectedCategories.includes(item) ? "active" : ""}`}
                    onClick={() => toggleCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="preference-editor-actions">
              <button
                type="button"
                className="mypage-main-edit-btn"
                onClick={savePreferenceSelection}
                disabled={savingPreference}
              >
                {savingPreference ? "저장 중..." : "관심사 저장"}
              </button>
            </div>
          </div>
        </div>

        <div className="deadline-settings-card">
          <div>
            <div className="preference-title">마감 임박 문화 알림</div>
            <div className="preference-subtitle">
              저장한 행사가 종료되기 전에 알림으로 다시 챙겨드려요.
            </div>
          </div>
          <div className="deadline-settings-controls">
            <label className="deadline-toggle">
              <input
                type="checkbox"
                checked={deadlineSettings.enabled}
                onChange={(event) => updateDeadlineSettings({ enabled: event.target.checked })}
              />
              <span>{deadlineSettings.enabled ? "알림 켜짐" : "알림 꺼짐"}</span>
            </label>
            <div className="deadline-days">
              {[7, 3].map((day) => (
                <button
                  key={day}
                  type="button"
                  className={deadlineSettings.daysBefore === day ? "active" : ""}
                  onClick={() => updateDeadlineSettings({ daysBefore: day })}
                  disabled={!deadlineSettings.enabled}
                >
                  {day}일 전
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="companion-overlap-card">
          <div className="visit-badge-header">
            <div>
              <div className="visit-badge-title">취향 겹침 동행 추천</div>
              <div className="visit-badge-subtitle">
                내 저장 행사, 관심 지역·장르, 팔로우 관계를 함께 비교했어요.
              </div>
            </div>
            <button
              type="button"
              className="mypage-main-edit-btn"
              onClick={() => navigate("/friends")}
            >
              친구 더 찾기
            </button>
          </div>

          <div className="companion-status-grid">
            <div>
              <strong>{followingSaveUserCount}</strong>
              <span>팔로우 저장 사용자</span>
            </div>
            <div>
              <strong>{followingSavedFestivals.length}</strong>
              <span>팔로우 저장 행사</span>
            </div>
            <div>
              <strong>{interestCount}</strong>
              <span>내 관심사</span>
            </div>
            <div>
              <strong>{recommendedCompanions.length}</strong>
              <span>추천 후보</span>
            </div>
          </div>

          <div className="companion-follow-save-panel">
            <div className="companion-subsection-head">
              <div>
                <strong>팔로우 저장목록</strong>
                <span>팔로우한 사람들이 저장한 행사로 동행 후보를 더 쉽게 고를 수 있어요.</span>
              </div>
              {followingSavedFestivals.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setShowAllFollowingSaves((prev) => !prev)}
                >
                  {showAllFollowingSaves ? "접기" : `더보기 ${followingSavedFestivals.length - 3}`}
                </button>
              ) : null}
            </div>

            {followingSavedFestivals.length === 0 ? (
              <div className="companion-follow-save-empty">
                아직 팔로우한 사용자가 저장한 행사가 없어요. 추천 사용자에서 팔로우를 늘리면 이곳에 모여요.
              </div>
            ) : (
              <div className="companion-follow-save-list">
                {visibleFollowingSaves.map((festival, index) => {
                  const period = [
                    formatShortDate(festival.startDate || festival.start_date),
                    formatShortDate(festival.endDate || festival.end_date),
                  ].filter(Boolean).join(" - ");
                  const owner = festival.savedByNickname || festival.savedByEmail || "팔로우";

                  return (
                    <button
                      type="button"
                      key={`${festival.savedByEmail || "user"}-${festival.id || festival.title}-${index}`}
                      className="companion-follow-save-item"
                      onClick={() => festival.id && navigate(`/detail/${festival.id}`)}
                      disabled={!festival.id}
                    >
                      <span>{owner.slice(0, 1)}</span>
                      <div>
                        <strong>{festival.title || "문화행사"}</strong>
                        <p>
                          {[owner, festival.region, period].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <em>보기</em>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {discoverLoading ? (
            <div className="companion-empty">
              <div>취향이 비슷한 친구를 찾는 중이에요.</div>
            </div>
          ) : recommendedCompanions.length === 0 ? (
            <div className="companion-empty">
              <div>아직 추천 후보가 없어요.</div>
              <div className="companion-empty-guide">
                팔로우한 사람의 저장 행사, 내 저장 행사, 관심 지역·장르가 쌓이면 추천 정확도가 올라가요.
              </div>
              <div className="companion-empty-actions">
                <button type="button" onClick={() => navigate("/friends")}>
                  취향 친구 찾기
                </button>
                <button type="button" onClick={() => navigate("/search")}>
                  저장할 행사 찾기
                </button>
              </div>
            </div>
          ) : (
            <div className="companion-overlap-list">
              {recommendedCompanions.map((match) => {
                const festival = topFestivalForParty(match);
                const reasons = match.matchReasons?.length
                  ? match.matchReasons
                  : match.reasons || [];

                return (
                <div key={match.email} className="companion-overlap-item">
                  <div className="companion-overlap-score">{match.matchScore || match.score}%</div>
                  <div className="companion-overlap-main">
                    <div className="companion-overlap-title">
                      <div className="companion-overlap-name">{match.nickname}</div>
                      <span className={`companion-follow-state ${match.mutualFollow ? "mutual" : match.following ? "following" : "new"}`}>
                        {getFollowLabel(match)}
                      </span>
                    </div>
                    <div className="companion-overlap-meta">
                      {festival?.title || match.sampleSavedFestivalTitles?.[0] || "저장한 문화행사"} 기준으로 잘 맞아요.
                    </div>
                    <div className="party-match-reasons">
                      {reasons.map((reason) => (
                        <span key={reason}>{reason}</span>
                      ))}
                    </div>
                    <div className="companion-match-stats">
                      <span>저장 겹침 {match.overlapCount || 0}</span>
                      <span>좋아요 {match.likeOverlapCount || 0}</span>
                      <span>지역 {match.regionOverlapCount || match.regionHits || 0}</span>
                      <span>장르 {match.categoryOverlapCount || match.categoryHits || 0}</span>
                      <span>팔로워 {match.followerCount || 0}</span>
                    </div>
                  </div>
                  <div className="companion-card-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${encodeURIComponent(match.email)}`)}
                    >
                      프로필
                    </button>
                    <button
                      type="button"
                      onClick={() => openCompanionChat(match)}
                      disabled={!match.mutualFollow}
                    >
                      채팅
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {companionRequestTarget ? (
          <div className="companion-modal-backdrop" onClick={closeCompanionRequest}>
            <div className="companion-modal" onClick={(event) => event.stopPropagation()}>
              <div className="companion-modal-head">
                <div>
                  <strong>동행 요청</strong>
                  <span>{companionRequestTarget.nickname}님에게 보낼 요청을 작성해요.</span>
                </div>
                <button type="button" onClick={closeCompanionRequest}>닫기</button>
              </div>

              <div className="companion-request-event">
                {topFestivalForParty(companionRequestTarget)?.title || "함께 갈 행사"}
              </div>

              <div className="companion-modal-label">가능한 요일</div>
              <div className="companion-weekdays">
                {WEEKDAY_OPTIONS.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    className={requestWeekdays.includes(day.key) ? "active" : ""}
                    onClick={() => toggleRequestWeekday(day.key)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              <div className="companion-modal-label">첫 메시지</div>
              <textarea
                className="companion-request-textarea"
                value={requestMessage}
                onChange={(event) => setRequestMessage(event.target.value)}
                placeholder={`${getWeekdayLabels(requestWeekdays).join(", ")} 중 편한 날에 같이 가실래요?`}
              />

              <button type="button" className="companion-primary-btn" onClick={sendCompanionRequest}>
                동행 요청 보내기
              </button>
            </div>
          </div>
        ) : null}

        {chatTarget ? (
          <div className="companion-modal-backdrop" onClick={closeCompanionChat}>
            <div className="companion-modal chat" onClick={(event) => event.stopPropagation()}>
              <div className="companion-modal-head">
                <div>
                  <strong>{chatTarget.nickname}님과 채팅</strong>
                  <span>{topFestivalForParty(chatTarget)?.title || "관심 행사"} 동행 이야기</span>
                </div>
                <button type="button" onClick={closeCompanionChat}>닫기</button>
              </div>

              <div className="companion-chat-list">
                {chatMessages.length === 0 ? (
                  <div className="companion-chat-empty">아직 메시지가 없어요.</div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`companion-chat-bubble ${
                        String(message.senderEmail).toLowerCase() === String(user?.email || "").toLowerCase()
                          ? "mine"
                          : ""
                      }`}
                    >
                      <strong>{message.senderName}</strong>
                      <p>{message.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="companion-chat-form">
                <input
                  value={chatText}
                  onChange={(event) => setChatText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendCompanionChat();
                  }}
                  placeholder="메시지를 입력하세요"
                />
                <button type="button" onClick={sendCompanionChat}>전송</button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mypage-journey-card">
          <div className="journey-left">
            <div className="journey-map">
              <div className="journey-dot dot-1" />
              <div className="journey-dot dot-2" />
              <div className="journey-dot dot-3" />
              <div className="journey-dot dot-4" />
              <div className="journey-dot dot-5" />
              <div className="journey-path" />
            </div>

            <p className="journey-count">
              {journey?.totalVisits > 0 ? (
                <>
                  총 <span>{journey.totalVisits}</span>개의 행사를 다녀왔어요.
                </>
              ) : (
                "아직 문화 스탬프가 비어 있어요."
              )}
            </p>
            {!journey?.totalVisits && (
              <button
                type="button"
                className="journey-start-btn"
                onClick={() => navigate("/search")}
              >
                다녀온 행사 찾기
              </button>
            )}
          </div>

          <div className="journey-right">
            <p className="journey-title">나의 문화 여정</p>
            <div className="journey-steps">
              <div className={`journey-step ${journey?.totalVisits > 0 ? "active" : ""}`}>
                <div className="step-badge">{journey?.totalVisits || "-"}</div>
                <div className="step-text">
                  <div className="step-label">{journey?.levelName || "여정 준비 중"}</div>
                  <div className="step-desc">
                    {journey?.levelDescription ||
                      "방문 기록 기반 문화 여정 기능을 계속 확장하고 있어요."}
                  </div>
                </div>
              </div>
            </div>

            {journey?.totalVisits > 0 && (
              <div className="journey-detail-grid">
                <div className="journey-detail-box">
                  <div className="journey-detail-label">가장 많이 간 지역</div>
                  <div className="journey-detail-value">{journey.topRegion || "-"}</div>
                </div>
                <div className="journey-detail-box">
                  <div className="journey-detail-label">가장 많이 간 카테고리</div>
                  <div className="journey-detail-value">{journey.topCategory || "-"}</div>
                </div>
                <div className="journey-detail-box">
                  <div className="journey-detail-label">이번 달 방문</div>
                  <div className="journey-detail-value">{journey.thisMonthVisits || 0}회</div>
                </div>
                <div className="journey-detail-box">
                  <div className="journey-detail-label">문화 점수</div>
                  <div className="journey-detail-value">{journey.cultureScore || 0}점</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="culture-passport-card">
          <div className="culture-passport-top">
            <div>
              <div className="culture-passport-label">문화 취향 여권</div>
              <div className="culture-passport-title">{nickname}님의 문화 스탬프</div>
              <div className="culture-passport-desc">
                다녀왔어요를 누른 행사가 지역 도장, 장르 기록, 문화 점수, 수집 배지로 자동 정리돼요.
              </div>
            </div>
            <div className="culture-passport-score">
              <strong>{journey?.cultureScore || 0}</strong>
              <span>점</span>
            </div>
          </div>
          <div className="culture-passport-grid">
            <div className="culture-passport-panel">
              <div className="culture-passport-panel-title">방문 지역 도장</div>
              <div className="passport-stamp-row">
                {regionStats.length > 0 ? (
                  regionStats.map((item) => (
                    <span key={item.name}>{item.name}</span>
                  ))
                ) : (
                  <span className="muted">방문 지역을 모으는 중</span>
                )}
              </div>
            </div>
            <div className="culture-passport-panel">
              <div className="culture-passport-panel-title">자주 찾은 장르</div>
              <div className="passport-ratio-list">
                {categoryStats.length > 0 ? (
                  categoryStats.map((item) => (
                    <div key={item.name} className="passport-ratio-item">
                      <span>{item.name}</span>
                      <div>
                        <i style={{ width: `${(Number(item.count || 0) / maxCategoryCount) * 100}%` }} />
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ))
                ) : (
                  <div className="passport-ratio-empty">다녀온 행사 장르가 여기에 쌓여요.</div>
                )}
              </div>
            </div>
          </div>

          <div className="passport-recent-panel">
            <div className="passport-recent-head">
              <div>
                <div className="culture-passport-panel-title">최근 문화 스탬프</div>
                <div className="passport-recent-subtitle">다녀왔어요를 누른 최근 행사예요.</div>
              </div>
              <button
                type="button"
                className="mypage-main-edit-btn"
                onClick={() => navigate("/mypage/visited")}
              >
                전체보기
              </button>
            </div>

            {journey?.totalVisits > 0 ? (
              <div className="passport-recent-list">
                {(journey.recentVisits || []).slice(0, 3).map((visit) => (
                  <button
                    type="button"
                    className="passport-recent-item"
                    key={`${visit.festivalId}-${visit.visitedAt}`}
                    onClick={() => visit.festivalId && navigate(`/detail/${visit.festivalId}`)}
                  >
                    <span className="passport-recent-seal" />
                    <div>
                      <strong>{visit.title || "행사명이 없어요"}</strong>
                      <p>
                        {[visit.region, visit.category, visit.visitedAt]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <em>보기</em>
                  </button>
                ))}
              </div>
            ) : (
              <div className="passport-ratio-empty">다녀온 행사가 생기면 여기에 최신 스탬프가 찍혀요.</div>
            )}
          </div>
        </div>

        <div className="visit-badge-card">
          <div className="visit-badge-header">
            <div>
              <div className="visit-badge-title">문화 배지 수집판</div>
              <div className="visit-badge-subtitle">
                방문 지역, 장르, 리뷰, 저장, 동행 활동을 기준으로 자동으로 열려요.
              </div>
            </div>
            <div className="visit-badge-summary">
              {unlockedBadgeCount}/{visitBadges.length}
            </div>
          </div>

          {nextBadge && (
            <div className="next-badge-hint">
              <span>수집률 {badgeCollectionRate}% · 수집 기준 상위 {badgeTopPercent}%</span>
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

      </div>
    </section>
  );
}

