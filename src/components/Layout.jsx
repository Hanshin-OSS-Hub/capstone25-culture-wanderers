import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AiChatWidget from "./AiChatWidget";
import { addCalendarEvent } from "../utils/calendarStorage";
import {
  getCurrentNotificationUserEmail,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  updateNotification,
} from "../utils/notificationStorage";

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

function toCalendarDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef(null);
  const [q, setQ] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(getCurrentNotificationUserEmail());

  const refreshNotifications = () => {
    const email = getCurrentNotificationUserEmail();
    setCurrentUser(email);
    setNotifications(getNotifications(email));
    setUnreadCount(getUnreadNotificationCount(email));
  };

  useEffect(() => {
    refreshNotifications();

    const handleChange = () => refreshNotifications();
    const handleClickOutside = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener("notifications-changed", handleChange);
    window.addEventListener("storage", handleChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("notifications-changed", handleChange);
      window.removeEventListener("storage", handleChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [location.pathname]);

  const onSubmitSearch = (event) => {
    event.preventDefault();
    const keyword = q.trim();
    if (!keyword) return;

    navigate(`/result?q=${encodeURIComponent(keyword)}`);
    setQ("");
  };

  const handleNotificationClick = (notification) => {
    if (!currentUser) {
      setIsNotificationOpen(false);
      navigate("/login");
      return;
    }

    markNotificationRead(notification.id, currentUser);
    refreshNotifications();
    setIsNotificationOpen(false);

    if (notification.type === "party-application-approved") {
      alert("파티장이 요청을 수락했어요.");

      if (!notification.calendarAdded) {
        const shouldAdd = window.confirm("내 일정표에 추가할까요?");
        if (shouldAdd) {
          addCalendarEvent(
            {
              date: toCalendarDate(notification.meetingTime),
              title: notification.festivalTitle || notification.partyTitle || "파티 일정",
              location: notification.location || "",
              festivalId: notification.festivalId || null,
              description: "",
              festivalPeriod: notification.meetingTime
                ? `${toCalendarDate(notification.meetingTime)} 일정`
                : "",
            },
            currentUser
          );
          updateNotification(notification.id, { calendarAdded: true }, currentUser);
          refreshNotifications();
        }
      }
    }

    if (notification.path) {
      navigate(notification.path);
      return;
    }

    if (notification.partyId) {
      navigate(`/party/${notification.partyId}`);
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">
          <Link to="/">문화유목민</Link>
        </div>

        <form className="header-search" onSubmit={onSubmitSearch}>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="검색어를 입력하세요"
          />
        </form>

        <nav className="header-nav">
          {currentUser ? (
            <div className="header-notification" ref={notificationRef}>
              <button
                type="button"
                className="header-notification-button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
              >
                <span>알림</span>
                {unreadCount > 0 ? <span className="header-notification-badge">{unreadCount}</span> : null}
              </button>

              {isNotificationOpen ? (
                <div className="header-notification-panel">
                  <div className="header-notification-panel-title">알림</div>
                  {notifications.length === 0 ? (
                    <div className="header-notification-empty">새 알림이 없어요.</div>
                  ) : (
                    <div className="header-notification-list">
                      {notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          className={`header-notification-item ${notification.read ? "" : "unread"}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="header-notification-item-top">
                            <strong>{notification.title}</strong>
                            <span>{formatNotificationTime(notification.createdAt)}</span>
                          </div>
                          <div className="header-notification-message">{notification.message}</div>
                          <div className="header-notification-cta">
                            {notification.actionLabel || "확인하러 가기"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <Link to="/search">축제 탐색</Link>
          <Link to="/party">파티 모집</Link>
          <Link to="/community">커뮤니티</Link>
          <Link to="/benefits">할인정보 모아보기</Link>
          {currentUser ? <Link to="/mypage">마이페이지</Link> : <Link to="/login">로그인</Link>}
        </nav>
      </header>

      <main className="app-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>문화유목민</h4>
            <p>학생을 위한 지역 문화 탐색과 파티 모집 플랫폼이에요.</p>
          </div>

          <div className="footer-col">
            <h5>서비스</h5>
            <ul>
              <li>축제 탐색</li>
              <li>할인정보 모아보기</li>
              <li>파티 모집</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>커뮤니티</h5>
            <ul>
              <li>질문 게시판</li>
              <li>리뷰 게시판</li>
              <li>자유 게시판</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>고객지원</h5>
            <ul>
              <li>FAQ</li>
              <li>문의하기</li>
              <li>이용안내</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">© 2026 문화유목민. All rights reserved.</div>
      </footer>

      <AiChatWidget />
    </div>
  );
}
