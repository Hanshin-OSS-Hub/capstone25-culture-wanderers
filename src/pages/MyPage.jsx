// src/pages/MyPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./MyPage.css";

const STORAGE_KEY = "loggedInUser";

export default function MyPage() {
  // 로그인 여부 확인
  const email =
    localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);

  if (!email) {
    window.location.href = "/login";
    return null;
  }

  const nickname = email.split("@")[0] || "유목민";

  // 더미 데이터 (나중에 백엔드 붙이면 여기만 교체)
  const profile = {
    joinDate: "2024.03.15",
    level: "Lv.1",
    temperature: 72.3,
    greeting: "오늘도 문화생활 즐기러 가볼까요?",
  };

  const stats = {
    reviews: 12,
    partyPosts: 3,
    joinedParties: 5,
    likedEvents: 24,
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  return (
    <main className="page mypage-page">
      <div className="mypage-container">
        {/* 상단 프로필 바 */}
        <section className="mypage-topcard">
          <div className="mypage-top-left">
            <div className="mypage-avatar">
              <span>{nickname.charAt(0).toUpperCase()}</span>
            </div>
            <div className="mypage-top-text">
              <div className="mypage-top-name">{nickname}</div>
              <div className="mypage-top-email">{email}</div>

              <div className="mypage-temp-row">
                <span className="mypage-temp-label">활동 온도</span>
                <div className="mypage-temp-bar-bg">
                  <div
                    className="mypage-temp-bar-fill"
                    style={{ width: `${profile.temperature}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mypage-top-right">
            <div className="mypage-top-temp-value">
              {profile.temperature.toFixed(1)}°C
            </div>
            <button
              type="button"
              className="mypage-top-edit-btn"
              onClick={() => alert("나중에 '내 정보 수정' 페이지로 연결 예정")}
            >
              내 정보 수정
            </button>
          </div>
        </section>

        {/* 본문: 좌측 메뉴 + 우측 내용 */}
        <div className="mypage-main-row">
          {/* 사이드 메뉴 */}
          <aside className="mypage-sidebar">
            <h2 className="mypage-side-title">내 정보</h2>
            <ul className="mypage-side-menu">
              <li className="active">
                <button type="button">
                  <span className="icon">👤</span> 내 정보
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert("추후 구현 예정: 내 정보 수정")}
                >
                  <span className="icon">✏️</span> 내 정보 수정
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert("추후 구현 예정: 좋아요 리스트")}
                >
                  <span className="icon">❤️</span> 좋아요 리스트
                </button>
              </li>
              <li>
                <Link to="/community">
                  <span className="icon">📝</span> 내 후기
                </Link>
              </li>
              <li>
                <Link to="/party">
                  <span className="icon">📣</span> 내 파티 모집글
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert("추후 구현 예정: 참여한 파티")}
                >
                  <span className="icon">🎉</span> 참여한 파티
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert("추후 구현 예정: 캘린더 · 일정")}
                >
                  <span className="icon">📅</span> 캘린더 · 일정
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="danger"
                  onClick={() => alert("추후 구현 예정: 회원탈퇴")}
                >
                  <span className="icon">⚙️</span> 회원탈퇴
                </button>
              </li>
            </ul>

            <button
              type="button"
              className="mypage-logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </aside>

          {/* 오른쪽 콘텐츠 */}
          <section className="mypage-main">
            <h2 className="mypage-section-title">내 정보</h2>

            {/* 정보 카드 */}
            <div className="mypage-info-card">
              <div className="mypage-info-left">
                <div className="mypage-info-icon">●</div>
                <div>
                  <div className="mypage-info-name">{nickname}님</div>
                  <div className="mypage-info-greeting">
                    {profile.greeting}
                  </div>
                </div>
              </div>
              <div className="mypage-info-right">
                <div className="mypage-info-item">
                  <span className="label">가입일</span>
                  <span className="value">{profile.joinDate}</span>
                </div>
                <div className="mypage-info-item">
                  <span className="label">활동 온도</span>
                  <span className="value">
                    {profile.temperature.toFixed(1)}°C
                  </span>
                </div>
                <div className="mypage-info-item">
                  <span className="label">레벨</span>
                  <span className="value">{profile.level}</span>
                </div>
              </div>
            </div>

            {/* 통계 카드 4개 */}
            <div className="mypage-stat-grid">
              <div className="mypage-stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-label">내가 쓴 리뷰</div>
                <div className="stat-value">{stats.reviews}</div>
              </div>

              <div className="mypage-stat-card">
                <div className="stat-icon">📣</div>
                <div className="stat-label">내가 쓴 파티 모집글</div>
                <div className="stat-value">{stats.partyPosts}</div>
              </div>

              <div className="mypage-stat-card">
                <div className="stat-icon">🎉</div>
                <div className="stat-label">참여한 파티</div>
                <div className="stat-value">{stats.joinedParties}</div>
              </div>

              <div className="mypage-stat-card">
                <div className="stat-icon">💗</div>
                <div className="stat-label">좋아요한 행사</div>
                <div className="stat-value">{stats.likedEvents}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
