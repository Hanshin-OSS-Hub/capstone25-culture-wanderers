import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { authFetch } from "../api/authFetch";
import { addNotification, getDisplayName } from "../utils/notificationStorage";
import "./Party.css";

const getStoredEmail = () =>
  localStorage.getItem("loggedInUser") ||
  sessionStorage.getItem("loggedInUser") ||
  localStorage.getItem("email") ||
  sessionStorage.getItem("email") ||
  "";

const getStoredNickname = () =>
  localStorage.getItem("nickname") || sessionStorage.getItem("nickname") || "";

const emptyApplicationForm = {
  message: "",
  age: "",
  gender: "여성",
};

function formatDateTime(value, fallback = "일정 미정") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function formatConditionText(condition) {
  const raw = String(condition || "").trim();
  if (!raw) return "별도의 모집 조건이 없습니다.";
  if (raw.toUpperCase() === "GENERAL") return "별도의 모집 조건이 없습니다.";
  return raw;
}

function buildDeadlineGuide(deadline, meetingTime) {
  const now = Date.now();
  const deadlineTs = deadline ? new Date(deadline).getTime() : null;
  const meetingTs = meetingTime ? new Date(meetingTime).getTime() : null;

  if (deadlineTs && !Number.isNaN(deadlineTs) && now > deadlineTs) {
    return `모집 마감일이 지나서 마감되었어요. (${formatDateTime(deadline)})`;
  }
  if (meetingTs && !Number.isNaN(meetingTs) && now > meetingTs) {
    return `모임 일시가 지나서 마감되었어요. (${formatDateTime(meetingTime)})`;
  }
  if (deadline) {
    return `${formatDateTime(deadline)}까지 신청할 수 있어요.`;
  }
  return "마감 정보가 없습니다.";
}

function getCommentAuthor(comment) {
  return (
    comment.userNickname ||
    comment.nickname ||
    comment.userEmail ||
    comment.email ||
    "사용자"
  );
}

function getCommentEmail(comment) {
  return comment.userEmail || comment.email || "";
}

function isMine(comment, currentUserEmail) {
  const email = String(getCommentEmail(comment) || "").toLowerCase();
  return email && email === String(currentUserEmail || "").toLowerCase();
}

export default function PartyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [party, setParty] = useState(null);
  const [comments, setComments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm);
  const [approvingMemberId, setApprovingMemberId] = useState(null);
  const [deletingParty, setDeletingParty] = useState(false);
  const [showFestivalLinkModal, setShowFestivalLinkModal] = useState(false);
  const [festivalCandidates, setFestivalCandidates] = useState([]);
  const [loadingFestivalCandidates, setLoadingFestivalCandidates] = useState(false);
  const [linkingFestivalId, setLinkingFestivalId] = useState(null);

  const currentUserEmail = getStoredEmail();
  const currentUserName = getDisplayName({
    email: currentUserEmail,
    nickname: getStoredNickname(),
  });

  const loadParty = async () => {
    const data = await authFetch("/api/party-posts");
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const found = list.find((item) => String(item.id) === String(id));

    if (!found) {
      setParty(null);
      return null;
    }

    const currentCount = found.currentPeople ?? 0;
    const maxCount = found.maxPeople ?? 2;
    const rawStatus = String(found.status || "RECRUITING").toUpperCase();
    const isClosed = rawStatus === "CLOSED";

    const normalizedParty = {
      id: String(found.id),
      rawStatus,
      isClosed,
      status: isClosed ? "모집 마감" : "신청 가능",
      title: found.title || "제목 없음",
      festival: found.festivalTitle || "연결된 축제 없음",
      hasFestivalLink: Boolean(found.festivalId),
      date: formatDateTime(found.meetingTime, "일정 미정"),
      location: found.location || "장소 미정",
      currentCount,
      maxCount,
      hostName: found.authorNickname || "작성자",
      hostEmail: found.authorEmail || "",
      detail: found.content || "상세 내용이 없습니다.",
      condition: formatConditionText(found.category),
      contact: found.contact || "연락 방법 정보가 없습니다.",
      deadlineGuide: buildDeadlineGuide(found.deadline, found.meetingTime),
      festivalId: found.festivalId,
      commentCount: found.commentCount ?? 0,
      meetingTime: found.meetingTime,
      deadline: found.deadline,
    };

    setParty(normalizedParty);
    return normalizedParty;
  };

  const loadComments = async () => {
    const data = await authFetch(`/api/comments?targetType=PARTY&targetId=${id}`);
    setComments(Array.isArray(data) ? data : []);
  };

  const loadApplications = async (partyInfo) => {
    const target = partyInfo || party;
    if (
      !target?.hostEmail ||
      !currentUserEmail ||
      currentUserEmail.toLowerCase() !== String(target.hostEmail).toLowerCase()
    ) {
      setApplications([]);
      return;
    }

    try {
      const data = await authFetch(`/api/party-posts/${id}/applications`);
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("파티 신청 목록 로딩 실패:", error);
      setApplications([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const loadedParty = await loadParty();
        await Promise.all([loadComments(), loadApplications(loadedParty)]);
      } catch (error) {
        console.error("파티 상세 로딩 실패:", error);
        setParty(null);
        setComments([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const progress = useMemo(() => {
    if (!party || !party.maxCount) return 0;
    return Math.min(100, (party.currentCount / party.maxCount) * 100);
  }, [party]);

  const isAuthor = useMemo(() => {
    if (!party?.hostEmail || !currentUserEmail) return false;
    return String(party.hostEmail).toLowerCase() === String(currentUserEmail).toLowerCase();
  }, [party, currentUserEmail]);

  const pendingApplications = applications.filter((item) => item.status === "PENDING");

  const openApplicationModal = () => {
    if (!party) return;
    if (!currentUserEmail) {
      setShowAuthRequiredModal(true);
      return;
    }
    if (isAuthor) {
      alert("작성자는 자신의 파티에 참여 신청할 수 없어요.");
      return;
    }
    if (party.isClosed || party.currentCount >= party.maxCount) {
      alert("모집이 이미 마감된 파티예요.");
      return;
    }
    setApplicationForm(emptyApplicationForm);
    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    if (!applicationForm.message.trim()) {
      alert("신청 메시지를 적어주세요.");
      return;
    }
    if (!applicationForm.age) {
      alert("나이를 선택해주세요.");
      return;
    }

    try {
      setJoining(true);
      await authFetch(`/api/parties/${party.id}/join`, {
        method: "POST",
        body: JSON.stringify({
          message: applicationForm.message.trim(),
          age: Number(applicationForm.age),
          gender: applicationForm.gender,
        }),
      });

      if (
        party?.hostEmail &&
        String(party.hostEmail).toLowerCase() !== String(currentUserEmail).toLowerCase()
      ) {
        addNotification(party.hostEmail, {
          type: "party-application-requested",
          title: "파티 참여 신청이 들어왔어요",
          message: `${currentUserName}님이 "${party.title}" 파티 모집글에 참여 신청을 했어요.`,
          partyId: Number(id),
          actionLabel: "확인하러 가기",
          path: `/party/${id}`,
        });
      }

      setShowApplicationModal(false);
      setApplicationForm(emptyApplicationForm);
      alert("참여 신청이 완료되었어요.");
      await Promise.all([loadParty(), loadApplications()]);
    } catch (error) {
      console.error("파티 참여 신청 실패:", error);
      alert("로그인 상태와 신청 가능 여부를 확인해주세요.");
    } finally {
      setJoining(false);
    }
  };

  const approveApplication = async (memberId) => {
    const targetApplication = applications.find(
      (application) => String(application.id) === String(memberId)
    );

    try {
      setApprovingMemberId(memberId);
      await authFetch(`/api/party-posts/${id}/applications/${memberId}/approve`, {
        method: "POST",
      });

      if (targetApplication?.userEmail) {
        addNotification(targetApplication.userEmail, {
          type: "party-application-approved",
          title: "파티 참여 요청이 수락되었어요",
          message: `${party?.hostName || "파티장"}님이 "${party?.title || "파티"}" 참여 요청을 수락했어요.`,
          partyId: Number(id),
          partyTitle: party?.title || "",
          festivalTitle: party?.festival || "",
          festivalId: party?.festivalId || null,
          meetingTime: party?.meetingTime || "",
          location: party?.location || "",
          actionLabel: "확인하러 가기",
          path: `/party/${id}`,
        });
      }

      alert("참여 신청을 수락했어요.");
      await Promise.all([loadParty(), loadApplications()]);
    } catch (error) {
      console.error("파티 신청 수락 실패:", error);
      alert("요청 수락에 실패했어요.");
    } finally {
      setApprovingMemberId(null);
    }
  };

  const handleCommentSubmit = async () => {
    const content = commentText.trim();
    if (!content) return;

    try {
      setSubmittingComment(true);
      await authFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          targetType: "PARTY",
          targetId: Number(id),
          content,
        }),
      });

      if (
        party?.hostEmail &&
        String(party.hostEmail).toLowerCase() !== String(currentUserEmail).toLowerCase()
      ) {
        addNotification(party.hostEmail, {
          type: "party-comment-added",
          title: "파티 모집글에 새 댓글이 달렸어요",
          message: `${currentUserName}님이 "${party.title}" 파티 모집글에 댓글을 남겼어요.`,
          partyId: Number(id),
          actionLabel: "확인하러 가기",
          path: `/party/${id}`,
        });
      }

      setCommentText("");
      await Promise.all([loadComments(), loadParty()]);
    } catch (error) {
      console.error("파티 댓글 등록 실패:", error);
      alert("로그인 후 댓글을 작성해주세요.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentUpdate = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;

    try {
      setSavingComment(true);
      await authFetch(`/api/comments/${editingCommentId}`, {
        method: "PATCH",
        body: JSON.stringify({ content: editingCommentText.trim() }),
      });
      setEditingCommentId(null);
      setEditingCommentText("");
      await Promise.all([loadComments(), loadParty()]);
    } catch (error) {
      console.error("파티 댓글 수정 실패:", error);
      alert("댓글 수정에 실패했어요.");
    } finally {
      setSavingComment(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;

    try {
      await authFetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      await Promise.all([loadComments(), loadParty()]);
    } catch (error) {
      console.error("파티 댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했어요.");
    }
  };

  const handleEditParty = () => {
    navigate("/mypage/posts", { state: { editPartyId: Number(id) } });
  };

  const openFestivalLinkModal = async () => {
    if (!party || !isAuthor) return;

    try {
      setShowFestivalLinkModal(true);
      setLoadingFestivalCandidates(true);
      const query = encodeURIComponent(party.title || "");
      const region = encodeURIComponent(party.location || "");
      const response = await fetch(
        `http://localhost:8080/api/festivals/link-candidates?query=${query}&region=${region}`
      );
      const data = await response.json();
      setFestivalCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("축제 연결 후보 조회 실패:", error);
      setFestivalCandidates([]);
    } finally {
      setLoadingFestivalCandidates(false);
    }
  };

  const handleLinkFestival = async (festival) => {
    if (!festival?.id) return;

    try {
      setLinkingFestivalId(festival.id);
      await authFetch(`/api/party-posts/${id}/festival-link`, {
        method: "PATCH",
        body: JSON.stringify({ festivalId: festival.id }),
      });
      await loadParty();
      setShowFestivalLinkModal(false);
      setFestivalCandidates([]);
      alert(`"${festival.title}" 행사와 연결했어요.`);
    } catch (error) {
      console.error("축제 연결 실패:", error);
      alert("행사 연결에 실패했어요.");
    } finally {
      setLinkingFestivalId(null);
    }
  };

  const handleDeleteParty = async () => {
    if (!window.confirm("이 파티 모집글을 삭제할까요?")) return;

    try {
      setDeletingParty(true);
      await authFetch(`/api/party-posts/${id}`, {
        method: "DELETE",
      });
      alert("파티 모집글을 삭제했어요.");
      navigate("/mypage/posts");
    } catch (error) {
      console.error("파티 모집글 삭제 실패:", error);
      alert("파티 모집글 삭제에 실패했어요.");
    } finally {
      setDeletingParty(false);
    }
  };

  if (loading) {
    return <div className="loading-box">파티 정보를 불러오는 중이에요.</div>;
  }

  if (!party) {
    return (
      <div className="party-detail-page">
        <button className="party-back-btn" onClick={() => navigate(-1)}>
          ← 파티 목록으로
        </button>
        <div className="party-detail-card">
          <div className="party-detail-body">
            <section className="party-detail-section">
              <h2>파티 정보를 찾을 수 없어요</h2>
              <p>삭제되었거나 접근할 수 없는 모집글일 수 있어요.</p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="party-detail-page">
      <button className="party-back-btn" onClick={() => navigate(-1)}>
        ← 파티 목록으로
      </button>

      <section className="party-festival-section">
        <div
          className={`party-festival-card ${party.isClosed ? "party-festival-card-closed" : ""} ${
            party.hasFestivalLink ? "" : "party-festival-card-fallback"
          }`}
        >
          <div className="party-festival-tag">관련 행사</div>
          <h2 className="party-festival-title">{party.festival}</h2>
          <p className="party-festival-meta">
            {party.date} · {party.location}
          </p>
          <button
            className={`party-festival-link-btn ${
              !party.hasFestivalLink && !isAuthor ? "disabled" : ""
            }`}
            onClick={() => {
              if (party.festivalId) {
                navigate(`/detail/${party.festivalId}`);
                return;
              }
              if (isAuthor) {
                openFestivalLinkModal();
              }
            }}
            disabled={!party.hasFestivalLink && !isAuthor}
            title={
              party.hasFestivalLink
                ? "관련 행사 상세로 이동"
                : isAuthor
                ? "연결할 행사를 직접 선택할 수 있어요"
                : "연결된 행사 정보가 없어요"
            }
          >
            {party.hasFestivalLink
              ? "관련 행사 상세보기"
              : isAuthor
              ? "행사 연결하기"
              : "연결된 행사 정보 없음"}
          </button>
        </div>
      </section>

      <div className={`party-detail-card ${party.isClosed ? "party-detail-card-closed" : ""}`}>
        <div className="party-detail-header">
          <div className="party-badges-row">
            <span className={`badge-status ${party.isClosed ? "closed" : ""}`}>{party.status}</span>
          </div>

          <h1 className="party-detail-title">{party.title}</h1>

          <div className="party-detail-meta">
            <div>
              <span className="meta-label">축제</span>
              <span>{party.festival}</span>
            </div>
            <div>
              <span className="meta-label">일시</span>
              <span>{party.date}</span>
            </div>
            <div>
              <span className="meta-label">장소</span>
              <span>{party.location}</span>
            </div>
          </div>
        </div>

        <div className="party-detail-body">
          <section className="party-detail-section">
            <h2>모집 현황</h2>
            <div className="party-progress-header">
              <span className="party-progress-label">확정 인원</span>
              <span className="party-count-text">
                {party.currentCount}/{party.maxCount}명
              </span>
            </div>
            <div className="party-progress-bar">
              <div
                className={`party-progress-fill ${party.isClosed ? "closed" : ""}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {isAuthor ? (
              <p className="party-inline-note">대기 중 신청 {pendingApplications.length}건</p>
            ) : null}
          </section>

          <section className="party-detail-section">
            <h2>행사 소개 / 함께 할 내용</h2>
            <p>{party.detail}</p>
          </section>

          <section className="party-detail-section">
            <h2>모집 조건</h2>
            <p>{party.condition}</p>
          </section>

          <section className="party-detail-section">
            <h2>연락 방법</h2>
            <p>{party.contact}</p>
          </section>

          <section className="party-detail-section">
            <h2>마감 안내</h2>
            <p>{party.deadlineGuide}</p>
          </section>

          <section className="party-detail-section">
            <h2>파티장 정보</h2>
            <div className="party-host party-host-extended">
              <div>
                <div className="party-host-name">{party.hostName}</div>
                <div className="party-host-email">{party.hostEmail || "이메일 정보 없음"}</div>
              </div>
            </div>
          </section>

          <div className="party-detail-actions">
            {isAuthor ? (
              <div className="party-owner-actions">
                <button
                  type="button"
                  className="party-detail-apply-btn secondary"
                  onClick={handleEditParty}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="party-detail-apply-btn danger"
                  onClick={handleDeleteParty}
                  disabled={deletingParty}
                >
                  {deletingParty ? "삭제 중..." : "삭제"}
                </button>
              </div>
            ) : (
              <button
                className={`party-detail-apply-btn ${party.isClosed ? "disabled" : ""}`}
                onClick={openApplicationModal}
                disabled={joining || party.isClosed || party.currentCount >= party.maxCount}
              >
                {joining ? "신청 중..." : party.isClosed ? "모집 마감" : "참여 신청하기"}
              </button>
            )}
          </div>
        </div>
      </div>

      {isAuthor ? (
        <section className="party-comments-card">
          <div className="party-comments-header">
            <h2>참여 신청 목록</h2>
          </div>

          {applications.length === 0 ? (
            <p className="party-comments-empty">아직 들어온 신청이 없어요.</p>
          ) : (
            <div className="party-comments-list">
              {applications.map((application) => (
                <article key={application.id} className="party-comment-item">
                  <div className="party-comment-meta">
                    <span>{application.userNickname || application.userEmail}</span>
                    <span>
                      {application.createdAt
                        ? String(application.createdAt).slice(0, 16).replace("T", " ")
                        : ""}
                    </span>
                  </div>
                  <p className="party-comment-content">
                    {application.message || "신청 메시지가 없습니다."}
                  </p>
                  <div className="party-application-extra">
                    <span>나이 {application.age || "-"}</span>
                    <span>성별 {application.gender || "-"}</span>
                    <span>{application.status === "APPROVED" ? "수락 완료" : "대기 중"}</span>
                  </div>
                  {application.status === "PENDING" ? (
                    <div className="party-comment-actions">
                      <button
                        type="button"
                        onClick={() => approveApplication(application.id)}
                        disabled={approvingMemberId === application.id || party.isClosed}
                      >
                        {approvingMemberId === application.id ? "수락 중..." : "수락"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="party-comments-card">
        <div className="party-comments-header">
          <h2>파티 댓글 {comments.length}</h2>
        </div>

        <div className="party-comment-write">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="파티에 참여하고 싶은 이유나 궁금한 점을 남겨보세요."
            disabled={submittingComment}
          />
          <button type="button" onClick={handleCommentSubmit} disabled={submittingComment}>
            {submittingComment ? "등록 중..." : "댓글 등록"}
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="party-comments-empty">아직 댓글이 없어요.</p>
        ) : (
          <div className="party-comments-list">
            {comments.map((comment) => {
              const mine = isMine(comment, currentUserEmail);
              const editing = editingCommentId === comment.id;

              return (
                <article key={comment.id} className="party-comment-item">
                  <div className="party-comment-meta">
                    <span>{getCommentAuthor(comment)}</span>
                    <span>
                      {comment.createdAt
                        ? String(comment.createdAt).slice(0, 16).replace("T", " ")
                        : ""}
                    </span>
                  </div>

                  {editing ? (
                    <>
                      <textarea
                        className="party-comment-edit"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={3}
                      />
                      <div className="party-comment-actions">
                        <button type="button" onClick={handleCommentUpdate} disabled={savingComment}>
                          {savingComment ? "저장 중..." : "저장"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText("");
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="party-comment-content">{comment.content}</p>
                  )}

                  {mine && !editing ? (
                    <div className="party-comment-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingCommentText(comment.content || "");
                        }}
                      >
                        수정
                      </button>
                      <button type="button" onClick={() => handleCommentDelete(comment.id)}>
                        삭제
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showFestivalLinkModal ? (
        <div
          className="party-modal-overlay"
          role="presentation"
          onClick={() => setShowFestivalLinkModal(false)}
        >
          <div
            className="party-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>관련 행사 연결하기</h3>
            <p className="party-modal-sub">
              파티 제목과 비슷한 문화행사를 골라 연결할 수 있어요.
            </p>

            {loadingFestivalCandidates ? (
              <p className="party-comments-empty">연결할 행사 후보를 찾는 중이에요.</p>
            ) : festivalCandidates.length === 0 ? (
              <p className="party-comments-empty">
                자동으로 찾은 행사 후보가 없어요. 제목을 조금 더 축제명에 가깝게 수정해보면
                연결이 쉬워져요.
              </p>
            ) : (
              <div className="party-comments-list">
                {festivalCandidates.map((festival) => (
                  <article key={festival.id} className="party-comment-item">
                    <div className="party-comment-meta">
                      <span>{festival.title}</span>
                      <span>
                        {festival.startDate} - {festival.endDate}
                      </span>
                    </div>
                    <p className="party-comment-content">
                      {festival.region} {festival.location}
                    </p>
                    <div className="party-comment-actions">
                      <button
                        type="button"
                        onClick={() => handleLinkFestival(festival)}
                        disabled={linkingFestivalId === festival.id}
                      >
                        {linkingFestivalId === festival.id ? "연결 중..." : "이 행사로 연결"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="party-modal-actions">
              <button
                type="button"
                className="party-detail-apply-btn secondary"
                onClick={() => setShowFestivalLinkModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showApplicationModal ? (
        <div
          className="party-modal-overlay"
          role="presentation"
          onClick={() => setShowApplicationModal(false)}
        >
          <div
            className="party-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>참여 신청</h3>
            <p className="party-modal-sub">
              간단한 정보를 남기면 파티장이 확인 후 수락할 수 있어요.
            </p>

            <div className="party-modal-field">
              <label htmlFor="party-application-message">신청 메시지</label>
              <textarea
                id="party-application-message"
                value={applicationForm.message}
                onChange={(e) =>
                  setApplicationForm((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="party-modal-row">
              <div className="party-modal-field">
                <label htmlFor="party-application-age">나이</label>
                <select
                  id="party-application-age"
                  value={applicationForm.age}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({ ...prev, age: e.target.value }))
                  }
                >
                  <option value="">선택</option>
                  {Array.from({ length: 43 }, (_, idx) => idx + 18).map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>

              <div className="party-modal-field">
                <label htmlFor="party-application-gender">성별</label>
                <select
                  id="party-application-gender"
                  value={applicationForm.gender}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({ ...prev, gender: e.target.value }))
                  }
                >
                  <option value="여성">여성</option>
                  <option value="남성">남성</option>
                  <option value="선택 안 함">선택 안 함</option>
                </select>
              </div>
            </div>

            <div className="party-modal-actions">
              <button
                type="button"
                className="party-detail-apply-btn secondary"
                onClick={() => setShowApplicationModal(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="party-detail-apply-btn"
                onClick={submitApplication}
                disabled={joining}
              >
                {joining ? "신청 중..." : "신청하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAuthRequiredModal ? (
        <div
          className="party-modal-overlay"
          role="presentation"
          onClick={() => setShowAuthRequiredModal(false)}
        >
          <div
            className="party-modal-card party-auth-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>로그인이 필요합니다</h3>
            <p className="party-modal-sub">
              참여 신청은 로그인 후 이용할 수 있어요. 로그인하거나 회원가입 후 다시 시도해주세요.
            </p>

            <div className="party-modal-actions party-modal-actions-stacked">
              <button
                type="button"
                className="party-detail-apply-btn"
                onClick={() => navigate("/login")}
              >
                로그인하러 가기
              </button>
              <button
                type="button"
                className="party-detail-apply-btn secondary"
                onClick={() => navigate("/signup")}
              >
                회원가입 하러가기
              </button>
              <button
                type="button"
                className="party-detail-apply-btn secondary"
                onClick={() => setShowAuthRequiredModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
