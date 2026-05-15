import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AiChatWidget from "./AiChatWidget";
import { addCalendarEvent } from "../utils/calendarStorage";
import {
  addCompanionChatMessage,
  getNextDateForWeekday,
  getWeekdayLabels,
} from "../utils/companionRequestStorage";
import {
  buildDeadlineCalendarEvent,
  notifySavedFestivalDeadlines,
} from "../utils/festivalDeadlineNotifications";
import {
  getCurrentNotificationUserEmail,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  updateNotification,
} from "../utils/notificationStorage";

const WEEKDAY_LABEL_LOOKUP = {
  일: "sun",
  월: "mon",
  화: "tue",
  수: "wed",
  목: "thu",
  금: "fri",
  토: "sat",
};

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
    if (currentUser) {
      notifySavedFestivalDeadlines(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshNotifications();

    const handleChange = () => refreshNotifications();
    const handleSaveChange = () => {
      const email = getCurrentNotificationUserEmail();
      if (email) notifySavedFestivalDeadlines(email);
      refreshNotifications();
    };
    const handleClickOutside = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener("notifications-changed", handleChange);
    window.addEventListener("festival-saves-changed", handleSaveChange);
    window.addEventListener("deadline-notification-settings-changed", handleSaveChange);
    window.addEventListener("storage", handleChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("notifications-changed", handleChange);
      window.removeEventListener("festival-saves-changed", handleSaveChange);
      window.removeEventListener("deadline-notification-settings-changed", handleSaveChange);
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
      alert("파티 참여 요청이 수락되었어요.");

      if (!notification.calendarAdded) {
        const shouldAdd = window.confirm("내 캘린더에 파티 일정을 추가할까요?");
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

    if (notification.type === "festival-ending-soon" && notification.festival) {
      const result = addCalendarEvent(
        buildDeadlineCalendarEvent(notification.festival, notification.plannedDate),
        currentUser
      );

      alert(result.added ? "종료 임박 축제를 일정표에 추가했어요." : "이미 같은 일정이 캘린더에 있어요.");
      navigate("/mypage/calendar");
      return;
    }

    if (notification.path) {
      navigate(notification.path);
      return;
    }

    if (notification.partyId) {
      navigate(`/party/${notification.partyId}`);
    }
  };

  const acceptCalendarInvite = (notification) => {
    if (!currentUser || !notification?.event) return;

    const result = addCalendarEvent(
      {
        ...notification.event,
        title: `${notification.event.title || "초대 일정"} (초대받은 일정)`,
      },
      currentUser
    );

    updateNotification(
      notification.id,
      {
        read: true,
        inviteStatus: "accepted",
        calendarAdded: true,
      },
      currentUser
    );
    refreshNotifications();
    alert(result.added ? "초대 일정을 내 캘린더에 추가했어요." : "이미 같은 일정이 캘린더에 있어요.");
    setIsNotificationOpen(false);
    navigate("/mypage/calendar");
  };

  const acceptCompanionRequest = (notification) => {
    if (!currentUser || !notification?.event) return;

    const weekdayLabels = getWeekdayLabels(notification.weekdays);
    const fallbackWeekday = notification.weekdays?.[0] || "sat";
    const selectedLabel = window.prompt(
      `가능한 요일: ${weekdayLabels.join(", ") || "토"}\n함께 갈 요일을 입력해주세요.`,
      weekdayLabels[0] || "토"
    );
    const selectedOption =
      WEEKDAY_LABEL_LOOKUP[selectedLabel?.trim()] || fallbackWeekday;
    const selectedDate = getNextDateForWeekday(selectedOption);
    const companions = [
      {
        email: notification.requesterEmail,
        nickname: notification.requesterName,
      },
      {
        email: currentUser,
        nickname: "나",
      },
    ];
    const event = {
      ...notification.event,
      date: selectedDate,
      title: `${notification.event.title || "문화행사"} 동행`,
      companions,
      companionRequestId: notification.requestId,
      companionChatId: notification.chatId,
      description: `${notification.requesterName}님과 함께 가는 동행 일정입니다.`,
    };

    const result = addCalendarEvent(event, currentUser);
    if (notification.requesterEmail) {
      addCalendarEvent(
        {
          ...event,
          companions,
        },
        notification.requesterEmail
      );
    }

    addCompanionChatMessage(notification.chatId, {
      senderEmail: currentUser,
      senderName: "수락 알림",
      text: `${selectedDate} 일정으로 동행 요청이 수락되었어요.`,
    });

    updateNotification(
      notification.id,
      {
        read: true,
        inviteStatus: "accepted",
        calendarAdded: true,
        selectedDate,
      },
      currentUser
    );
    refreshNotifications();
    alert(result.added ? "동행 일정을 내 캘린더에 추가했어요." : "이미 같은 일정이 캘린더에 있어요.");
    setIsNotificationOpen(false);
    navigate("/mypage/calendar");
  };

  const declineCompanionRequest = (notification) => {
    if (!currentUser) return;

    addCompanionChatMessage(notification.chatId, {
      senderEmail: currentUser,
      senderName: "거절 알림",
      text: "동행 요청이 거절되었어요.",
    });

    updateNotification(
      notification.id,
      {
        read: true,
        inviteStatus: "declined",
      },
      currentUser
    );
    refreshNotifications();
    alert("동행 요청을 거절했어요.");
  };

  const declineCalendarInvite = (notification) => {
    if (!currentUser) return;

    updateNotification(
      notification.id,
      {
        read: true,
        inviteStatus: "declined",
      },
      currentUser
    );
    refreshNotifications();
    alert("일정 초대를 거절했어요.");
  };

  const renderNotification = (notification) => {
    if (notification.type === "calendar-invite") {
      return (
        <div
          key={notification.id}
          className={`header-notification-item ${notification.read ? "" : "unread"}`}
        >
          <div className="header-notification-item-top">
            <strong>{notification.title}</strong>
            <span>{formatNotificationTime(notification.createdAt)}</span>
          </div>
          <div className="header-notification-message">{notification.message}</div>
          {notification.inviteStatus === "accepted" ? (
            <div className="header-notification-cta">수락 완료</div>
          ) : notification.inviteStatus === "declined" ? (
            <div className="header-notification-cta">거절 완료</div>
          ) : (
            <div className="header-notification-actions">
              <button type="button" onClick={() => acceptCalendarInvite(notification)}>
                수락
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => declineCalendarInvite(notification)}
              >
                거절
              </button>
            </div>
          )}
        </div>
      );
    }

    if (notification.type === "companion-request") {
      return (
        <div
          key={notification.id}
          className={`header-notification-item ${notification.read ? "" : "unread"}`}
        >
          <div className="header-notification-item-top">
            <strong>{notification.title}</strong>
            <span>{formatNotificationTime(notification.createdAt)}</span>
          </div>
          <div className="header-notification-message">{notification.message}</div>
          {notification.inviteStatus === "accepted" ? (
            <div className="header-notification-cta">수락 완료</div>
          ) : notification.inviteStatus === "declined" ? (
            <div className="header-notification-cta">거절 완료</div>
          ) : (
            <div className="header-notification-actions">
              <button type="button" onClick={() => acceptCompanionRequest(notification)}>
                예
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => declineCompanionRequest(notification)}
              >
                아니오
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
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
    );
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">
          <Link to="/">문화유목민</Link>
        </div>

        <nav className="header-nav">
          <Link to="/search">축제 검색</Link>
          <Link to="/party">파티 모집</Link>
          <Link to="/community">커뮤니티</Link>
          <Link to="/benefits">할인정보 모아보기</Link>
        </nav>

        <form className="header-search" onSubmit={onSubmitSearch}>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="검색어를 입력하세요"
          />
        </form>

        <div className="header-actions">
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
                      {notifications.map((notification) => renderNotification(notification))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {currentUser ? <Link to="/mypage">마이페이지</Link> : <Link to="/login">로그인</Link>}
        </div>
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
              <li>축제 검색</li>
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
