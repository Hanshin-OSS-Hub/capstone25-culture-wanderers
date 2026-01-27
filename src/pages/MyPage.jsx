// src/pages/MyPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./MyPage.css";

const STORAGE_KEY = "loggedInUser";

export default function MyPage() {
  const email =
    localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);

  if (!email) {
    window.location.href = "/login";
    return null;
  }

  const nickname = email.split("@")[0] || "유목민";

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

  // ⭐ 문화 여정 더미 데이터 (나중에 백엔드 연결하면 여기만 교체)
  const journey = {
    visitedPlaces: 20,
    milestones: [
      {
        id: 1,
        label: "첫 발걸음",
        desc: "가까운 전시·축제부터 시작했어요",
        threshold: 1,
      },
      {
        id: 2,
        label: "동네 탐험가",
        desc: "내가 좋아하는 동네 스폿이 생겼어요",
        threshold: 5,
      },
      {
        id: 3,
        label: "도시 유목민",
        desc: "여기저기 새로운 문화 공간을 여행 중이에요",
        threshold: 15,
      },
    ],
  };

  const currentStepIndex = journey.milestones.reduce(
    (acc, m, idx) => (journey.visitedPlaces >= m.threshold ? idx : acc),
    -1
  );

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  const handleWithdraw = () => {
    const ok = window.confirm(
      "정말 탈퇴하시겠어요? 작성한 후기와 파티 정보가 모두 삭제됩니다."
    );
    if (ok) {
      alert("회원탈퇴 기능은 추후 구현 예정입니다.");
    }
  };

  const handleEditProfile = () => {
    alert("추후 '내 정보 수정' 페이지로 이동 예정입니다.");
  };

  return (
    <main className="page mypage-page">
      <div className="mypage-container">
        {/* ===== 상단 프로필 카드 ===== */}
        <section className="mypage-topcard">
          <div className="mypage-top-left">
            <div className="mypage-avatar">
              <span>{nickname.charAt(0).toUpperCase()}</span>
            </div>
            <div className="mypage-top-text">
              <div className="mypage-top-name">{nickname}</div>
              <div className="mypage-top-email">{email}</div>
            </div>
          </div>

          <div className="mypage-top-right">
            <button
              type="button"
              className="mypage-top-edit-btn"
              onClick={handleEditProfile}
            >
              내 정보 수정
            </button>
          </div>
        </section>

        {/* ===== 메인 레이아웃: 사이드바 + 내용 ===== */}
        <div className="mypage-main-row">
          {/* 사이드바 */}
          <aside className="mypage-sidebar">
            <ul className="mypage-side-menu">
              <li className="active">
                <button type="button">
                  <span className="icon">👤</span>
                  내 정보
                </button>
              </li>
              <li>
                <button type="button" onClick={handleEditProfile}>
                  <span className="icon">✏️</span>
                  내 정보 수정
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert("추후 구현 예정: 좋아요 리스트")}
                >
                  <span className="icon">❤️</span>
                  좋아요 리스트
                </button>
              </li>
              <li>
                <Link to="/community">
                  <span className="icon">⭐</span>
                  내 후기
                </Link>
              </li>
              <li>
                <Link to="/party">
                  <span className="icon">📣</span>
                  내 파티 모집글
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert("추후 구현 예정: 참여한 파티")}
                >
                  <span className="icon">🎉</span>
                  참여한 파티
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert("추후 구현 예정: 캘린더·일정")}
                >
                  <span className="icon">📅</span>
                  캘린더·일정
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="danger"
                  onClick={handleWithdraw}
                >
                  <span className="icon">⚙️</span>
                  회원탈퇴
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

          {/* 오른쪽 메인 영역 */}
          <section className="mypage-main">
            <div className="mypage-main-panel">
              <h2 className="mypage-section-title">내 정보</h2>

              {/* 상단 기본 정보 카드 */}
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
                </div>

              </div>

              {/* ⭐ 나의 문화 여정 카드 */}
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
                    지금까지 <span>{journey.visitedPlaces}곳</span>의 문화
                    공간을 탐험했어요
                  </p>
                </div>

                <div className="journey-right">
                  <p className="journey-title">나의 문화 여정</p>
                  <div className="journey-steps">
                    {journey.milestones.map((step, index) => (
                      <div
                        key={step.id}
                        className={
                          "journey-step" +
                          (index <= currentStepIndex ? " active" : "")
                        }
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

              {/* 하단 통계 카드 4개 */}
              <div className="mypage-stat-grid">
                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">📄</div>
                    <div className="stat-text">
                      <div className="stat-title"><br/>내가 쓴 리뷰</div>
                    </div>
                  </div>
                  <div className="stat-value">{stats.reviews}</div>
                </div>

                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">📣</div>
                    <div className="stat-text">
                      <div className="stat-title"><br/>내가 쓴 파티 모집글</div>
                    </div>
                  </div>
                  <div className="stat-value">{stats.partyPosts}</div>
                </div>

                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-text">
                      <div className="stat-title"><br/>참여한 파티</div>
                    </div>
                  </div>
                  <div className="stat-value">{stats.joinedParties}</div>
                </div>

                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">💗</div>
                    <div className="stat-text">
                      <div className="stat-title"><br/>좋아요한 행사</div>
                    </div>
                  </div>
                  <div className="stat-value">{stats.likedEvents}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
