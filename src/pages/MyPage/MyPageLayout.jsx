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
  const [followStats, setFollowStats] = useState({
    followerCount: 0,
    followingCount: 0,
  });
  const [followPublic, setFollowPublic] = useState(true);
  const [followModal, setFollowModal] = useState({
    open: false,
    type: "followers",
    users: [],
    loading: false,
    error: "",
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
    } catch {
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

  useEffect(() => {
    const loadFollowInfo = async () => {
      const currentEmail = getStoredEmail();
      if (!currentEmail) return;

      try {
        const encodedEmail = encodeURIComponent(currentEmail);
        const [stats, privacy] = await Promise.all([
          authFetch(`/api/users/${encodedEmail}/follow-stats`),
          authFetch("/api/me/follow-privacy"),
        ]);

        setFollowStats({
          followerCount: stats?.followerCount || 0,
          followingCount: stats?.followingCount || 0,
        });
        setFollowPublic(privacy?.public !== false);
      } catch (error) {
        console.error("팔로우 정보 로딩 실패:", error);
      }
    };

    loadFollowInfo();
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

  const openFollowModal = async (type) => {
    const currentEmail = profile.email || getStoredEmail();
    if (!currentEmail) return;

    const title = type === "followers" ? "팔로워" : "팔로잉";
    setFollowModal({
      open: true,
      type,
      users: [],
      loading: true,
      error: "",
    });

    try {
      const users = await authFetch(`/api/users/${encodeURIComponent(currentEmail)}/${type}`);
      setFollowModal({
        open: true,
        type,
        users: Array.isArray(users) ? users : [],
        loading: false,
        error: "",
      });
    } catch (error) {
      console.error(`${title} 목록 로딩 실패:`, error);
      setFollowModal({
        open: true,
        type,
        users: [],
        loading: false,
        error: "목록을 불러오지 못했습니다.",
      });
    }
  };

  const closeFollowModal = () => {
    setFollowModal((prev) => ({ ...prev, open: false }));
  };

  const toggleFollowPublic = async () => {
    const nextPublic = !followPublic;
    setFollowPublic(nextPublic);

    try {
      const result = await authFetch("/api/me/follow-privacy", {
        method: "PUT",
        body: JSON.stringify({ public: nextPublic }),
      });
      setFollowPublic(result?.public !== false);
    } catch (error) {
      console.error("팔로우 공개 설정 저장 실패:", error);
      setFollowPublic(!nextPublic);
      alert("공개 설정 저장에 실패했습니다.");
    }
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
              <div className="mypage-follow-row">
                <button type="button" onClick={() => openFollowModal("followers")}>
                  팔로워 <strong>{followStats.followerCount}</strong>
                </button>
                <button type="button" onClick={() => openFollowModal("following")}>
                  팔로잉 <strong>{followStats.followingCount}</strong>
                </button>
              </div>
            </div>
          </div>
          <div className="mypage-top-right">
            <NavLink
              to={`/profile/${encodeURIComponent(email)}`}
              className="mypage-follow-privacy"
            >
              내 활동 보기
            </NavLink>
            <button
              type="button"
              className={`mypage-follow-privacy ${followPublic ? "public" : "private"}`}
              onClick={toggleFollowPublic}
            >
              {followPublic ? "팔로우 목록 공개" : "팔로우 목록 비공개"}
            </button>
          </div>
        </section>

        {followModal.open ? (
          <div className="mypage-follow-modal-backdrop" onClick={closeFollowModal}>
            <div className="mypage-follow-modal" onClick={(event) => event.stopPropagation()}>
              <div className="mypage-follow-modal-header">
                <h3>{followModal.type === "followers" ? "팔로워" : "팔로잉"}</h3>
                <button type="button" onClick={closeFollowModal}>
                  닫기
                </button>
              </div>

              {followModal.loading ? (
                <div className="mypage-follow-empty">불러오는 중입니다.</div>
              ) : followModal.error ? (
                <div className="mypage-follow-empty">{followModal.error}</div>
              ) : followModal.users.length === 0 ? (
                <div className="mypage-follow-empty">
                  {followModal.type === "followers" ? "팔로워가 없습니다." : "팔로잉한 사용자가 없습니다."}
                </div>
              ) : (
                <div className="mypage-follow-list">
                  {followModal.users.map((item) => (
                    <NavLink
                      key={item.email}
                      to={`/profile/${encodeURIComponent(item.email)}`}
                      className="mypage-follow-user"
                      onClick={closeFollowModal}
                    >
                      <div className="mypage-follow-avatar">
                        {(item.nickname || item.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="mypage-follow-name">{item.nickname || item.email}</div>
                        <div className="mypage-follow-email">{item.email}</div>
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

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
                <NavLink to="saves" className={({ isActive }) => (isActive ? "active" : "")}>
                  저장한 축제
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
