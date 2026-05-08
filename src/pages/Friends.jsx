import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../api/authFetch";
import { useAuth } from "../auth/AuthContext";
import SavedFestivalCard from "../components/SavedFestivalCard";
import {
  addCompanionChatMessage,
  createCompanionRequestId,
} from "../utils/companionRequestStorage";
import {
  addNotification,
  getDisplayName,
  getNotifications,
} from "../utils/notificationStorage";
import "./Friends.css";

const normalizeUser = (item) => ({
  email: item.email || "",
  nickname: item.nickname || item.email?.split("@")[0] || "사용자",
  profileImage: item.profileImage || "",
  followerCount: item.followerCount ?? 0,
  followingCount: item.followingCount ?? 0,
  following: Boolean(item.following),
  savedFestivalCount: item.savedFestivalCount ?? 0,
  overlapCount: item.overlapCount ?? 0,
  matchScore: item.matchScore ?? 0,
  sampleSavedFestivalTitles: Array.isArray(item.sampleSavedFestivalTitles)
    ? item.sampleSavedFestivalTitles
    : [],
});

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getFestivalRequestKey = (requesterEmail, targetEmail, festival) =>
  [
    normalizeEmail(requesterEmail),
    normalizeEmail(targetEmail),
    festival?.id || festival?.festivalId || festival?.title || "event",
  ].join("|");

export default function Friends() {
  const navigate = useNavigate();
  const { isAuthed, user } = useAuth();
  const [activeTab, setActiveTab] = useState("following");
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [followingSavedFestivals, setFollowingSavedFestivals] = useState([]);
  const [pendingRequestKeys, setPendingRequestKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(true);
  const [error, setError] = useState("");

  const requesterEmail = normalizeEmail(user?.email);

  const refreshPendingRequests = useCallback((festivals) => {
    const source = Array.isArray(festivals) ? festivals : [];
    const next = new Set();
    const uniqueTargetEmails = new Set(
      source.map((festival) => normalizeEmail(festival.savedByEmail)).filter(Boolean)
    );

    uniqueTargetEmails.forEach((targetEmail) => {
      getNotifications(targetEmail)
        .filter(
          (notification) =>
            notification.type === "companion-request" &&
            notification.inviteStatus === "pending" &&
            normalizeEmail(notification.requesterEmail) === requesterEmail
        )
        .forEach((notification) => {
          const key = [
            requesterEmail,
            targetEmail,
            notification.event?.festivalId || notification.event?.title || "event",
          ].join("|");
          next.add(key);
        });
    });

    setPendingRequestKeys(next);
  }, [requesterEmail]);

  const loadUsers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const data = await authFetch(`/api/users/discover${params}`);
      setUsers(Array.isArray(data) ? data.map(normalizeUser) : []);
    } catch (err) {
      console.error("취향 친구 목록 로딩 실패:", err);
      setError("취향 친구 목록을 불러오지 못했어요.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFollowingSaves = useCallback(async () => {
    if (!isAuthed) {
      setFollowingSavedFestivals([]);
      setPendingRequestKeys(new Set());
      setSaveLoading(false);
      return;
    }

    try {
      setSaveLoading(true);
      const data = await authFetch("/api/me/following-saved-festivals");
      const next = Array.isArray(data) ? data : [];
      setFollowingSavedFestivals(next);
      refreshPendingRequests(next);
    } catch (err) {
      console.error("팔로우 저장목록 로딩 실패:", err);
      setFollowingSavedFestivals([]);
      setPendingRequestKeys(new Set());
    } finally {
      setSaveLoading(false);
    }
  }, [isAuthed, refreshPendingRequests]);

  useEffect(() => {
    loadUsers();
    loadFollowingSaves();
  }, [loadFollowingSaves, loadUsers]);

  useEffect(() => {
    refreshPendingRequests(followingSavedFestivals);
  }, [followingSavedFestivals, refreshPendingRequests]);

  useEffect(() => {
    const handleNotificationChange = () => refreshPendingRequests(followingSavedFestivals);
    window.addEventListener("notifications-changed", handleNotificationChange);
    return () => window.removeEventListener("notifications-changed", handleNotificationChange);
  }, [followingSavedFestivals, refreshPendingRequests]);

  const tabCounts = useMemo(
    () => ({
      following: users.filter((item) => item.following).length,
      recommended: users.filter((item) => !item.following).length,
      followingSaves: followingSavedFestivals.length,
    }),
    [followingSavedFestivals.length, users]
  );

  const filteredUsers = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    return users.filter((item) => {
      const matchesTab = activeTab === "following" ? item.following : !item.following;
      const matchesKeyword =
        !value || `${item.nickname} ${item.email}`.toLowerCase().includes(value);
      return matchesTab && matchesKeyword;
    });
  }, [activeTab, keyword, users]);

  const filteredFollowingSaves = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return followingSavedFestivals;
    return followingSavedFestivals.filter((festival) =>
      [
        festival.title,
        festival.region,
        festival.location,
        festival.savedByNickname,
        festival.savedByEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [followingSavedFestivals, keyword]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (activeTab !== "followingSaves") {
      loadUsers(keyword);
    }
  };

  const toggleFollow = async (targetUser) => {
    if (!isAuthed) {
      navigate("/login");
      return;
    }

    try {
      const method = targetUser.following ? "DELETE" : "POST";
      const result = await authFetch(`/api/users/${encodeURIComponent(targetUser.email)}/follow`, { method });
      setUsers((prev) =>
        prev.map((item) =>
          item.email === targetUser.email
            ? {
                ...item,
                following: Boolean(result?.following),
                followerCount: result?.followerCount ?? item.followerCount,
                followingCount: result?.followingCount ?? item.followingCount,
              }
            : item
        )
      );
      loadFollowingSaves();
    } catch (err) {
      console.error("팔로우 처리 실패:", err);
      alert("팔로우 처리에 실패했어요.");
    }
  };

  const sendSavedFestivalCompanionRequest = (festival) => {
    if (!isAuthed) {
      navigate("/login");
      return;
    }

    const targetEmail = normalizeEmail(festival.savedByEmail);
    if (!targetEmail) {
      alert("저장한 사용자의 이메일 정보가 없어 동행 요청을 보낼 수 없어요.");
      return;
    }

    const requestKey = getFestivalRequestKey(requesterEmail, targetEmail, festival);
    const alreadyPending = getNotifications(targetEmail).some(
      (notification) =>
        notification.type === "companion-request" &&
        notification.inviteStatus === "pending" &&
        normalizeEmail(notification.requesterEmail) === requesterEmail &&
        [
          requesterEmail,
          targetEmail,
          notification.event?.festivalId || notification.event?.title || "event",
        ].join("|") === requestKey
    );

    if (alreadyPending || pendingRequestKeys.has(requestKey)) {
      alert("이미 보낸 동행 요청이에요. 상대가 수락하거나 거절하기 전까지 다시 보낼 수 없어요.");
      refreshPendingRequests(followingSavedFestivals);
      return;
    }

    const requesterName = getDisplayName({
      email: requesterEmail,
      nickname: user?.nickname,
    });
    const targetName = festival.savedByNickname || getDisplayName({ email: targetEmail });
    const requestId = createCompanionRequestId();
    const chatId = [
      "following-save-companion",
      requesterEmail,
      targetEmail,
      festival.id || festival.title || "event",
    ]
      .filter(Boolean)
      .join("|");
    const event = {
      title: festival.title || "문화행사",
      location: [festival.region, festival.location].filter(Boolean).join(" ").trim(),
      festivalId: festival.id || null,
      festivalPeriod:
        festival.startDate && festival.endDate
          ? `${festival.startDate} - ${festival.endDate}`
          : "",
    };

    addCompanionChatMessage(chatId, {
      senderEmail: requesterEmail,
      senderName: requesterName,
      text: `${event.title} 같이 가고 싶어서 동행 요청을 보냈어요.`,
    });

    addNotification(targetEmail, {
      type: "companion-request",
      requestId,
      chatId,
      title: "동행 요청이 도착했어요.",
      message: `${requesterName}님이 "${event.title}" 동행요청을 했어요. 수락하시겠어요?`,
      actionLabel: "수락 / 거절",
      inviteStatus: "pending",
      requesterEmail,
      requesterName,
      targetEmail,
      targetName,
      weekdays: ["sat", "sun"],
      event,
    });

    setPendingRequestKeys((prev) => new Set(prev).add(requestKey));
    alert(`${targetName}님에게 동행 요청을 보냈어요.`);
  };

  const emptyUserMessage =
    activeTab === "following"
      ? "아직 팔로우한 사용자가 없어요. 추천 사용자 탭에서 취향이 맞는 사람을 팔로우해보세요."
      : keyword.trim()
        ? "검색어와 일치하는 팔로우 전 사용자가 없어요."
        : "아직 팔로우하지 않은 추천 사용자가 없어요.";

  return (
    <main className="friends-page">
      <section className="friends-header">
        <div>
          <p className="friends-kicker">취향 친구 찾기</p>
          <h1>비슷한 문화 취향을 가진 사용자를 찾아보세요</h1>
          <p>
            저장한 행사, 팔로우 관계, 방문 후기 활동을 바탕으로 살펴볼 만한 사용자를 추천해요.
          </p>
        </div>
        <button type="button" onClick={() => navigate("/mypage")}>
          마이페이지로 이동
        </button>
      </section>

      <form className="friends-search" onSubmit={handleSearchSubmit}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={
            activeTab === "followingSaves"
              ? "행사명, 지역, 저장한 사람으로 검색"
              : "닉네임이나 이메일로 검색"
          }
        />
        <button type="submit">검색</button>
      </form>

      <div className="friends-tabs" role="tablist" aria-label="취향 친구 분류">
        <button
          type="button"
          className={activeTab === "following" ? "active" : ""}
          onClick={() => setActiveTab("following")}
          role="tab"
          aria-selected={activeTab === "following"}
        >
          팔로우 <span>{tabCounts.following}</span>
        </button>
        <button
          type="button"
          className={activeTab === "recommended" ? "active" : ""}
          onClick={() => setActiveTab("recommended")}
          role="tab"
          aria-selected={activeTab === "recommended"}
        >
          추천 사용자 <span>{tabCounts.recommended}</span>
        </button>
        <button
          type="button"
          className={activeTab === "followingSaves" ? "active" : ""}
          onClick={() => setActiveTab("followingSaves")}
          role="tab"
          aria-selected={activeTab === "followingSaves"}
        >
          팔로우 저장목록 보기 <span>{tabCounts.followingSaves}</span>
        </button>
      </div>

      {activeTab === "followingSaves" ? (
        saveLoading ? (
          <div className="friends-empty">팔로우 저장목록을 불러오는 중입니다.</div>
        ) : filteredFollowingSaves.length === 0 ? (
          <div className="friends-empty">
            {keyword.trim()
              ? "검색어와 일치하는 팔로우 저장 행사가 없어요."
              : "팔로우한 사용자의 저장 행사가 아직 없어요."}
          </div>
        ) : (
          <section className="following-save-section">
            <div className="following-save-guide">
              팔로우한 사람들이 저장한 행사를 모아봤어요. 저장한 사람에게 바로 동행 요청을 보낼 수 있어요.
            </div>
            <div className="following-save-grid">
              {filteredFollowingSaves.map((festival, index) => {
                const targetEmail = normalizeEmail(festival.savedByEmail);
                const owner = festival.savedByNickname || getDisplayName({ email: targetEmail });
                const requestKey = getFestivalRequestKey(requesterEmail, targetEmail, festival);
                const isPending = pendingRequestKeys.has(requestKey);

                return (
                  <SavedFestivalCard
                    key={`${festival.savedByEmail || "user"}-${festival.id || festival.title}-${index}`}
                    festival={festival}
                    showSavedBy
                    actionLabel={isPending ? "요청 대기중" : `${owner}님에게 동행요청하기`}
                    actionDisabled={isPending}
                    onAction={() => sendSavedFestivalCompanionRequest(festival)}
                    onClick={() => festival.id && navigate(`/detail/${festival.id}`)}
                  />
                );
              })}
            </div>
          </section>
        )
      ) : loading ? (
        <div className="friends-empty">취향 친구를 불러오는 중입니다.</div>
      ) : error ? (
        <div className="friends-empty">{error}</div>
      ) : filteredUsers.length === 0 ? (
        <div className="friends-empty">{emptyUserMessage}</div>
      ) : (
        <section className="friends-grid">
          {filteredUsers.map((targetUser) => (
            <article className="friend-card" key={targetUser.email}>
              <div className="friend-card-top">
                <div className="friend-avatar">
                  {targetUser.profileImage ? (
                    <img src={targetUser.profileImage} alt="" />
                  ) : (
                    targetUser.nickname.slice(0, 1)
                  )}
                </div>
                <div>
                  <h2>{targetUser.nickname}</h2>
                  <p>{targetUser.email}</p>
                </div>
                <div className="friend-score">{targetUser.matchScore}%</div>
              </div>

              <div className="friend-meta">
                <span>팔로워 {targetUser.followerCount}</span>
                <span>팔로잉 {targetUser.followingCount}</span>
                <span>저장 {targetUser.savedFestivalCount}</span>
              </div>

              <div className="friend-reason">
                {targetUser.overlapCount > 0
                  ? `저장한 행사가 ${targetUser.overlapCount}개 겹쳐요.`
                  : targetUser.savedFestivalCount > 0
                    ? "저장한 문화행사를 보고 취향을 둘러볼 수 있어요."
                    : "아직 저장한 행사는 적지만 프로필을 둘러볼 수 있어요."}
              </div>

              {targetUser.sampleSavedFestivalTitles.length > 0 && (
                <div className="friend-saved-list">
                  {targetUser.sampleSavedFestivalTitles.map((title) => (
                    <span key={title}>{title}</span>
                  ))}
                </div>
              )}

              <div className="friend-actions">
                <button type="button" onClick={() => navigate(`/profile/${encodeURIComponent(targetUser.email)}`)}>
                  프로필 보기
                </button>
                <button
                  type="button"
                  className={targetUser.following ? "following" : ""}
                  onClick={() => toggleFollow(targetUser)}
                >
                  {targetUser.following ? "팔로우 취소" : "팔로우"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
