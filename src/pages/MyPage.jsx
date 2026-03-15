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

  // 더미 제거 후 실제로 보여줄 최소 정보만 유지
  const profile = {
    greeting: "오늘도 문화생활, 가볍게 한 번 떠나볼까요?",
  };

  // 더미 제거 후 안전하게 0 처리
  const stats = {
    reviews: 0,
    partyPosts: 0,
    joinedParties: 0,
    likedEvents: 0,
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  const handleWithdraw = () => {
    const ok = window.confirm("정말 탈퇴하시겠어요?");
    if (ok) {
      window.location.href = "/mypage/withdraw";
    }
  };

  const handleEditProfile = () => {
    window.location.href = "/mypage/info";
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
                <Link to="/mypage/likes">
                  <span className="icon">❤️</span>
                  좋아요 리스트
                </Link>
              </li>
              <li>
                <Link to="/mypage/reviews">
                  <span className="icon">⭐</span>
                  내 후기
                </Link>
              </li>
              <li>
                <Link to="/mypage/posts">
                  <span className="icon">📣</span>
                  내 파티 모집글
                </Link>
              </li>
              <li>
                <Link to="/mypage/parties">
                  <span className="icon">🎉</span>
                  참여한 파티
                </Link>
              </li>
              <li>
                <Link to="/mypage/calendar">
                  <span className="icon">📅</span>
                  캘린더·일정
                </Link>
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
                        <span className="label">이메일</span>
                        <span className="value">{email}</span>
                      </div>
                      <div className="mypage-info-item">
                        <span className="label">닉네임</span>
                        <span className="value">{nickname}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 문화 여정 카드 */}
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
                    아직 표시할 문화 여정 데이터가 없습니다
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

              {/* 하단 통계 카드 4개 */}
              <div className="mypage-stat-grid">
                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">📄</div>
                    <div className="stat-text">
                      <div className="stat-title"><br />내가 쓴 리뷰</div>
                    </div>
                  </div>
                  <div className="stat-value">{stats.reviews}</div>
                </div>

                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">📣</div>
                    <div className="stat-text">
                      <div className="stat-title"><br />내가 쓴 파티 모집글</div>
                    </div>
                  </div>
                  <div className="stat-value">{stats.partyPosts}</div>
                </div>

                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-text">
                      <div className="stat-title"><br />참여한 파티</div>
                    </div>
                  </div>
                  <div className="stat-value">{stats.joinedParties}</div>
                </div>

                <div className="mypage-stat-card">
                  <div className="stat-left">
                    <div className="stat-icon">💗</div>
                    <div className="stat-text">
                      <div className="stat-title"><br />좋아요한 행사</div>
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