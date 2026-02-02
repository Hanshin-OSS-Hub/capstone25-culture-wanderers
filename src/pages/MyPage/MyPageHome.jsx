// src/pages/MyPage/MyPageHome.jsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext"; // 경로 확인!
import "./MyPage.css"; // 기존 MyPage.css 재사용

export default function MyPageHome() {
  const navigate = useNavigate();
  const { user } = useAuth(); // RequireAuth로 감싸져 있으니 여기서 user는 있다고 가정 가능

  const nickname = useMemo(() => {
    if (user?.nickname) return user.nickname;
    if (user?.email) return user.email.split("@")[0];
    return "유목민";
  }, [user]);

  //  데모용 더미(나중에 백엔드 연결하면 여기만 교체)
  const profile = {
    joinDate: "2024.03.15",
    level: "Lv.5",
    temperature: 36.8,
    greeting: "오늘도 문화생활, 가볍게 한 번 떠나볼까요?",
  };

  const stats = {
    reviews: 12,
    partyPosts: 3,
    joinedParties: 5,
    likedEvents: 24,
  };

  const journey = {
    visitedPlaces: 20,
    milestones: [
      { id: 1, label: "첫 발걸음", desc: "가까운 전시·축제부터 시작했어요", threshold: 1 },
      { id: 2, label: "동네 탐험가", desc: "내가 좋아하는 동네 스폿이 생겼어요", threshold: 5 },
      { id: 3, label: "도시 유목민", desc: "여기저기 새로운 문화 공간을 여행 중이에요", threshold: 15 },
    ],
  };

  const currentStepIndex = journey.milestones.reduce(
    (acc, m, idx) => (journey.visitedPlaces >= m.threshold ? idx : acc),
    -1
  );

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
                  <span className="label">가입일</span>
                  <span className="value">{profile.joinDate}</span>
                </div>
                <div className="mypage-info-item">
                  <span className="label">활동 온도</span>
                  <span className="value">{profile.temperature.toFixed(1)}°C</span>
                </div>
                <div className="mypage-info-item">
                  <span className="label">레벨</span>
                  <span className="value">{profile.level}</span>
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
              지금까지 <span>{journey.visitedPlaces}곳</span>의 문화 공간을 탐험했어요
            </p>
          </div>

          <div className="journey-right">
            <p className="journey-title">나의 문화 여정</p>
            <div className="journey-steps">
              {journey.milestones.map((step, index) => (
                <div
                  key={step.id}
                  className={"journey-step" + (index <= currentStepIndex ? " active" : "")}
                >
                  <div className="step-badge">{index + 1}</div>
                  <div className="step-text">
                    <div className="step-label">{step.label}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
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

        {/* 아래는 선택: 퀵 링크 */}
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="mypage-quick-link" to="/mypage/calendar">📅 캘린더</Link>
          <Link className="mypage-quick-link" to="/mypage/info">✏️ 내 정보 수정</Link>
          <Link className="mypage-quick-link" to="/mypage/withdraw">⚙️ 회원탈퇴</Link>
        </div>
      </div>
    </section>
  );
}
