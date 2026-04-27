// src/pages/MyPage/MyPageHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../api/authFetch";
import { getLikedFestivals } from "../../utils/likeStorage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./MyPage.css";

export default function MyPageHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const nickname = useMemo(() => {
    if (user?.nickname) return user.nickname;
    if (user?.email) return user.email.split("@")[0];
    return "유목민";
  }, [user]);

  // 더미 제거 후 실제 사용자 정보만 사용
  const profile = {
    greeting: "오늘도 문화생활, 가볍게 한 번 떠나볼까요?",
  };

  const [stats, setStats] = useState({
    reviews: 0,
    partyPosts: 0,
    joinedParties: 0,
    likedEvents: 0,
  });

  useEffect(() => {
    const safeCount = (result) => {
      if (result.status !== "fulfilled") return 0;

      const data = result.value;

      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.data)) return data.data.length;

      return 0;
    };

    const fetchStats = async () => {
      const [reviews, partyPosts, joinedParties, likes] = await Promise.allSettled([
        authFetch("/api/me/reviews"),
        authFetch("/api/me/party-posts"),
        authFetch("/api/me/parties"),
        authFetch("/api/me/likes"),
      ]);

      setStats({
        reviews: safeCount(reviews),
        partyPosts: safeCount(partyPosts),
        joinedParties: safeCount(joinedParties),
        likedEvents: getLikedFestivals().length,
      });
    };

    fetchStats();
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

  return (
    <section className="mypage-main">
      <div className="mypage-main-panel">
        {/* ===== 상단 프로필 카드 ===== */}
        <section className="mypage-topcard">
          <div className="mypage-top-left">
            <div className="mypage-avatar">
              <span>{nickname.charAt(0).toUpperCase()}</span>
            </div>
            <div className="mypage-top-text">
              <div className="mypage-top-name">{nickname}</div>
              <div className="mypage-top-email">{user?.email || ""}</div>
            </div>
          </div>

          <div className="mypage-top-right">
            <button
              type="button"
              className="mypage-top-edit-btn"
              onClick={() => navigate("/mypage/info")}
            >
              내 정보 수정
            </button>
          </div>
        </section>

        <h2 className="mypage-section-title">내 정보</h2>

        {/* ===== 기본 정보 카드 ===== */}
        <div className="mypage-info-card">
          <div className="mypage-info-left">
            <div className="mypage-info-icon">●</div>

            <div className="mypage-info-text-group">
              <div className="mypage-info-name">{nickname}님</div>
              <div className="mypage-info-greeting">{profile.greeting}</div>

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

        {/* ===== 문화 여정 카드 ===== */}
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
              아직 표시할 문화 여정 데이터가 없습니다.
            </p>
          </div>

          <div className="journey-right">
            <p className="journey-title">나의 문화 여정</p>
            <div className="journey-steps">
              <div className="journey-step">
                <div className="step-badge">-</div>
                <div className="step-text">
                  <div className="step-label">데이터 준비 중</div>
                  <div className="step-desc">
                    방문 기록 기반 문화 여정 기능은 추후 연결 예정입니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 통계 카드 ===== */}
        <div className="mypage-stat-grid">
          <button
            type="button"
            className="mypage-stat-card clickable"
            onClick={() => navigate("/mypage/reviews")}
          >
            <div className="stat-left">
              <div className="stat-icon">📄</div>
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
              <div className="stat-icon">📣</div>
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
              <div className="stat-icon">🎉</div>
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
              <div className="stat-icon">💗</div>
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