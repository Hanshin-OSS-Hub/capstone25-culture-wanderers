import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import { useAuth } from "../../auth/AuthContext";
import { getLikedFestivals } from "../../utils/likeStorage";
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
  });
  const [preference, setPreference] = useState(null);
  const [journey, setJourney] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    const safeCount = (result) => {
      if (result.status !== "fulfilled") return 0;
      const data = result.value;
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.data)) return data.data.length;
      return 0;
    };

    const fetchPageData = async () => {
      const [reviews, partyPosts, joinedParties, likes, journeyResult, preferenceResult] =
        await Promise.allSettled([
          authFetch("/api/me/reviews"),
          authFetch("/api/me/party-posts"),
          authFetch("/api/me/parties"),
          authFetch("/api/me/likes"),
          authFetch("/api/me/journey"),
          authFetch("/api/recommend/preferences"),
        ]);

      const localLikedCount = getLikedFestivals().length;
      const remoteLikedCount =
        likes.status === "fulfilled" && Array.isArray(likes.value)
          ? likes.value.filter((item) => String(item.targetType || "").toLowerCase() === "festival").length
          : 0;

      setStats({
        reviews: safeCount(reviews),
        partyPosts: safeCount(partyPosts),
        joinedParties: safeCount(joinedParties),
        likedEvents: likes.status === "fulfilled" ? remoteLikedCount : localLikedCount,
      });

      setJourney(journeyResult.status === "fulfilled" ? journeyResult.value : null);

      if (preferenceResult.status === "fulfilled") {
        const data = preferenceResult.value;
        setPreference(data);
        setSelectedRegions(data?.selectedRegions || []);
        setSelectedCategories(data?.selectedCategories || []);
      } else {
        setPreference(null);
      }
    };

    fetchPageData();
  }, []);

  useEffect(() => {
    const syncLikedCount = () => {
      setStats((prev) => ({
        ...prev,
        likedEvents: getLikedFestivals().length,
      }));
    };

    window.addEventListener("festival-likes-changed", syncLikedCount);
    window.addEventListener("storage", syncLikedCount);

    return () => {
      window.removeEventListener("festival-likes-changed", syncLikedCount);
      window.removeEventListener("storage", syncLikedCount);
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
    setSavingPreference(true);
    try {
      const data = await authFetch("/api/recommend/preferences/selection", {
        method: "PUT",
        body: JSON.stringify({
          regions: selectedRegions,
          categories: selectedCategories,
        }),
      });

      setPreference(data);
      setSelectedRegions(data?.selectedRegions || []);
      setSelectedCategories(data?.selectedCategories || []);
      alert("관심사가 저장되었어요.");
    } catch (error) {
      console.error("관심사 저장 실패:", error);
      alert("관심사 저장에 실패했어요.");
    } finally {
      setSavingPreference(false);
    }
  };

  const selectedSummary = [...selectedRegions, ...selectedCategories];

  return (
    <section className="mypage-main">
      <div className="mypage-main-panel">
        <h2 className="mypage-section-title">내 정보</h2>

        <div className="mypage-info-card">
          <div className="mypage-info-left">
            <div className="mypage-info-icon">●</div>
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
                "아직 표시할 문화 여정 데이터가 없어요."
              )}
            </p>
          </div>

          <div className="journey-right">
            <p className="journey-title">나의 문화 여정</p>
            <div className="journey-steps">
              <div className={`journey-step ${journey?.totalVisits > 0 ? "active" : ""}`}>
                <div className="step-badge">{journey?.totalVisits || "-"}</div>
                <div className="step-text">
                  <div className="step-label">{journey?.levelName || "데이터 준비 중"}</div>
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
              </div>
            )}
          </div>
        </div>

        {journey?.totalVisits > 0 && (
          <div className="journey-history-card">
            <div className="journey-history-header">
              <div>
                <div className="journey-history-title">최근 방문 행사</div>
                <div className="journey-history-subtitle">
                  다녀왔어요 기록을 기준으로 정리했어요.
                </div>
              </div>
              <div className="journey-history-actions">
                <div className="journey-region-tags">
                  {(journey.regionStats || []).map((item) => (
                    <span key={item.name}>
                      {item.name} {item.count}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="mypage-main-edit-btn"
                  onClick={() => navigate("/mypage/visited")}
                >
                  전부보기
                </button>
              </div>
            </div>

            <div className="journey-visit-list">
              {(journey.recentVisits || []).map((visit) => (
                <button
                  type="button"
                  className="journey-visit-item"
                  key={`${visit.festivalId}-${visit.visitedAt}`}
                  onClick={() => visit.festivalId && navigate(`/detail/${visit.festivalId}`)}
                >
                  <div>
                    <div className="journey-visit-title">{visit.title || "행사명이 없어요"}</div>
                    <div className="journey-visit-meta">
                      {[visit.region, visit.category, visit.visitedAt]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <span>보기</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mypage-stat-grid">
          <button
            type="button"
            className="mypage-stat-card clickable"
            onClick={() => navigate("/mypage/reviews")}
          >
            <div className="stat-left">
              <div className="stat-icon">리</div>
              <div className="stat-text">
                <div className="stat-title">내가 쓴 리뷰</div>
              </div>
            </div>
            <div className="stat-value">{stats.reviews}</div>
          </button>

          <button
            type="button"
            className="mypage-stat-card clickable"
            onClick={() => navigate("/mypage/posts")}
          >
            <div className="stat-left">
              <div className="stat-icon">파</div>
              <div className="stat-text">
                <div className="stat-title">내가 쓴 파티 모집글</div>
              </div>
            </div>
            <div className="stat-value">{stats.partyPosts}</div>
          </button>

          <button
            type="button"
            className="mypage-stat-card clickable"
            onClick={() => navigate("/mypage/parties")}
          >
            <div className="stat-left">
              <div className="stat-icon">참</div>
              <div className="stat-text">
                <div className="stat-title">참여한 파티</div>
              </div>
            </div>
            <div className="stat-value">{stats.joinedParties}</div>
          </button>

          <button
            type="button"
            className="mypage-stat-card clickable"
            onClick={() => navigate("/mypage/likes")}
          >
            <div className="stat-left">
              <div className="stat-icon">좋</div>
              <div className="stat-text">
                <div className="stat-title">좋아요한 행사</div>
              </div>
            </div>
            <div className="stat-value">{stats.likedEvents}</div>
          </button>
        </div>
      </div>
    </section>
  );
}
