import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { authFetch } from "../../api/authFetch";

import "./MyPage.css";

const STORAGE_KEY = "loggedInUser";
const TOKEN_KEY = "token";
const NICKNAME_KEY = "nickname";

const getStoredEmail = () =>
  localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || "";

function saveNickname(nickname) {
  const safeNickname = String(nickname || "").trim();
  if (!safeNickname) return;

  if (localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(NICKNAME_KEY, safeNickname);
    sessionStorage.removeItem(NICKNAME_KEY);
    return;
  }

  if (sessionStorage.getItem(STORAGE_KEY)) {
    sessionStorage.setItem(NICKNAME_KEY, safeNickname);
    localStorage.removeItem(NICKNAME_KEY);
    return;
  }

  localStorage.setItem(NICKNAME_KEY, safeNickname);
}

export default function MyPageLayout() {
  const [profile, setProfile] = useState({
    email: getStoredEmail(),
    nickname: "",
  });

  const refreshProfile = async () => {
    try {
      const me = await authFetch("/api/me");
      const resolvedEmail = me?.email || getStoredEmail();
      const resolvedNickname = me?.nickname || (resolvedEmail ? resolvedEmail.split("@")[0] : "");

      setProfile({
        email: resolvedEmail,
        nickname: resolvedNickname,
      });
      saveNickname(resolvedNickname);
    } catch (error) {
      const fallbackEmail = getStoredEmail();
      const fallbackNickname = fallbackEmail ? fallbackEmail.split("@")[0] : "유목민";
      setProfile({
        email: fallbackEmail,
        nickname: fallbackNickname,
      });
      saveNickname(fallbackNickname);
    }
  };

  useEffect(() => {
    const email = getStoredEmail();
    if (!email) {
      window.location.href = "/login";
      return;
    }

    refreshProfile();
  }, []);

  const email = profile.email || getStoredEmail();
  const nickname = profile.nickname || (email ? email.split("@")[0] : "유목민");

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NICKNAME_KEY);
    sessionStorage.removeItem(NICKNAME_KEY);
    alert("로그아웃 했어요.");
    window.location.href = "/";
  };

  if (!email) {
    return null;
  }

  return (
    <main className="page mypage-page">
      <div className="mypage-container">
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
        </section>

        <div className="mypage-main-row">
          <aside className="mypage-sidebar">
            <ul className="mypage-side-menu">
              <li>
                <NavLink end to="." className={({ isActive }) => (isActive ? "active" : "")}>
                  내 정보
                </NavLink>
              </li>

              <li>
                <NavLink to="info" className={({ isActive }) => (isActive ? "active" : "")}>
                  내 정보 수정
                </NavLink>
              </li>

              <li>
                <NavLink to="likes" className={({ isActive }) => (isActive ? "active" : "")}>
                  좋아요 리스트
                </NavLink>
              </li>

              <li>
                <NavLink to="questions" className={({ isActive }) => (isActive ? "active" : "")}>
                  내 질문
                </NavLink>
              </li>

              <li>
                <NavLink to="reviews" className={({ isActive }) => (isActive ? "active" : "")}>
                  내 후기
                </NavLink>
              </li>

              <li>
                <NavLink to="posts" className={({ isActive }) => (isActive ? "active" : "")}>
                  내 파티 모집글
                </NavLink>
              </li>

              <li>
                <NavLink to="parties" className={({ isActive }) => (isActive ? "active" : "")}>
                  참여한 파티
                </NavLink>
              </li>

              <li>
                <NavLink to="calendar" className={({ isActive }) => (isActive ? "active" : "")}>
                  캘린더 일정
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="withdraw"
                  className={({ isActive }) => (isActive ? "active danger" : "danger")}
                >
                  회원탈퇴
                </NavLink>
              </li>
            </ul>

            <button type="button" className="mypage-logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </aside>

          <section className="mypage-main">
            <Outlet context={{ email, nickname, refreshProfile }} />
          </section>
        </div>
      </div>
    </main>
  );
}
