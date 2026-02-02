// src/pages/MyPage/MyPageLayout.jsx
import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import "./MyPage.css";

const STORAGE_KEY = "loggedInUser";

export default function MyPageLayout() {
  const navigate = useNavigate();

  const email =
    localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);

  // 로그인 안 되어 있으면 로그인 페이지로
  if (!email) {
    window.location.href = "/login";
    return null;
  }

  const nickname = email.split("@")[0] || "유목민";

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
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
              onClick={() => navigate("info")}
            >
              내 정보 수정
            </button>
          </div>
        </section>

        {/* ===== 메인 레이아웃: 사이드바 + 내용(Outlet) ===== */}
        <div className="mypage-main-row">
          <aside className="mypage-sidebar">
            <ul className="mypage-side-menu">
  <li>
    <NavLink end to="." className={({ isActive }) => (isActive ? "active" : "")}>
      👤 내 정보
    </NavLink>
  </li>

  <li>
    <NavLink to="info" className={({ isActive }) => (isActive ? "active" : "")}>
      ✏️ 내 정보 수정
    </NavLink>
  </li>

  <li>
    <NavLink to="likes" className={({ isActive }) => (isActive ? "active" : "")}>
      ❤️ 좋아요 리스트
    </NavLink>
  </li>

  <li>
    <NavLink to="reviews" className={({ isActive }) => (isActive ? "active" : "")}>
      ⭐ 내 후기
    </NavLink>
  </li>

  <li>
    <NavLink to="posts" className={({ isActive }) => (isActive ? "active" : "")}>
      📣 내 파티 모집글
    </NavLink>
  </li>

  <li>
    <NavLink to="parties" className={({ isActive }) => (isActive ? "active" : "")}>
      🎉 참여한 파티
    </NavLink>
  </li>

  <li>
    <NavLink to="calendar" className={({ isActive }) => (isActive ? "active" : "")}>
      📅 캘린더·일정
    </NavLink>
  </li>

  <li>
    <NavLink
      to="withdraw"
      className={({ isActive }) => (isActive ? "active danger" : "danger")}
    >
      ⚙️ 회원탈퇴
    </NavLink>
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

          <section className="mypage-main">
            <Outlet context={{ email, nickname }} />
          </section>
        </div>
      </div>
    </main>
  );
}
