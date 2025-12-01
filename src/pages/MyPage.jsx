// src/pages/MyPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./MyPage.css";

export default function MyPage() {
  const email = localStorage.getItem("loggedInUser");

  // 로그인 안 돼 있으면 로그인 페이지로 보내기
  if (!email) {
    window.location.href = "/login";
    return null;
  }

  // 이메일 앞부분을 닉네임처럼 사용
  const nickname = email.split("@")[0] || "유목민";

  // 더미 데이터 (나중에 백엔드 붙이면 여기만 교체하면 됨)
  const level = 1;
  const temperature = 72; // 온도 (%)
  const stats = {
    partyPosts: 2,
    joinedParties: 5,
    reviews: 3,
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  return (
    <main className="page mypage-page">
      <div className="mypage-wrapper">
        {/* 상단 타이틀 */}
        <section className="mypage-hero">
          <h1 className="mypage-title">마이페이지</h1>
          <p className="mypage-sub">
            대학생 문화 생활 기록과 활동 정보를 한눈에 확인해보세요.
          </p>
        </section>

        {/* 메인 카드 */}
        <section className="mypage-card">
          {/* 프로필 & 온도 */}
          <div className="mypage-profile-row">
            <div className="mypage-profile">
              <div className="mypage-avatar">
                <span>{nickname.charAt(0).toUpperCase()}</span>
              </div>
              <div className="mypage-profile-text">
                <div className="mypage-nickname">
                  {nickname}
                  <span className="mypage-level-badge">Lv.{level} 새싹 유목민</span>
                </div>
                <div className="mypage-email">{email}</div>
              </div>
            </div>

            <div className="mypage-temp">
              <div className="mypage-temp-label">
                나의 활동 온도
                <span className="mypage-temp-value">{temperature}°C</span>
              </div>
              <div className="mypage-temp-bar-bg">
                <div
                  className="mypage-temp-bar-fill"
                  style={{ width: `${temperature}%` }}
                />
              </div>
              <p className="mypage-temp-desc">
                후기·파티 활동이 많을수록 온도가 올라가요.
              </p>
            </div>
          </div>

          {/* 통계 3개 */}
          <div className="mypage-stats-row">
            <div className="mypage-stat-card">
              <div className="mypage-stat-label">파티 모집글</div>
              <div className="mypage-stat-value">{stats.partyPosts}</div>
              <div className="mypage-stat-sub">내가 직접 모집한 파티 수</div>
            </div>
            <div className="mypage-stat-card">
              <div className="mypage-stat-label">참여한 파티</div>
              <div className="mypage-stat-value">{stats.joinedParties}</div>
              <div className="mypage-stat-sub">함께 다녀온 축제·전시</div>
            </div>
            <div className="mypage-stat-card">
              <div className="mypage-stat-label">작성한 후기</div>
              <div className="mypage-stat-value">{stats.reviews}</div>
              <div className="mypage-stat-sub">사진 포함 솔직 후기 수</div>
            </div>
          </div>

          {/* 바로가기 섹션 */}
          <div className="mypage-sections">
            <div className="mypage-section">
              <h2>내 활동 관리</h2>
              <p>내가 작성한 글과 파티 모집 현황을 확인할 수 있어요.</p>
              <div className="mypage-actions">
                <Link to="/party" className="mypage-action-btn primary">
                  파티원 모집 보러가기
                </Link>
                <Link to="/community" className="mypage-action-btn">
                  커뮤니티 글 보러가기
                </Link>
              </div>
            </div>

            <div className="mypage-section">
              <h2>축제 · 후기 활동</h2>
              <p>새로운 축제를 찾고, 다녀온 후기는 사진과 함께 남겨보세요.</p>
              <div className="mypage-actions">
                <Link to="/search" className="mypage-action-btn">
                  축제 탐색하기
                </Link>
                <Link
                  to="/community/write/review"
                  className="mypage-action-btn primary-outline"
                >
                  후기 작성하러 가기
                </Link>
              </div>
            </div>

            <div className="mypage-section">
              <h2>학생 혜택 모아보기</h2>
              <p>학생 전용 할인·무료 전시 정보를 한 번에 볼 수 있어요.</p>
              <div className="mypage-actions">
                <Link to="/benefits" className="mypage-action-btn">
                  학생 할인 페이지 열기
                </Link>
              </div>
            </div>
          </div>

          {/* 로그아웃 */}
          <div className="mypage-footer">
            <button className="mypage-logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
