import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { authFetch } from "../api/authFetch";
import { addNotification, getDisplayName } from "../utils/notificationStorage";
import { canOpenUserProfile, openUserProfile } from "../utils/profileNavigation";
import { getCompanionTrust } from "../utils/companionTrustStorage";
import "./Community.css";

const BOARD_LABELS = {
  question: "질문 게시판",
  review: "리뷰 게시판",
  free: "자유게시판",
};

const CATEGORY_LABELS = {
  question: "질문",
  review: "리뷰",
  free: "자유",
};

const getStoredEmail = () =>
  localStorage.getItem("loggedInUser") || sessionStorage.getItem("loggedInUser") || "";

const getStoredNickname = () =>
  localStorage.getItem("nickname") || sessionStorage.getItem("nickname") || "";

export default function CommunityDetail() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [savingPost, setSavingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUserEmail = getStoredEmail();
  const currentUserNickname = getStoredNickname();
  const isReview = type === "review";
  const isFree = type === "free";
  const commentTargetType = isReview ? "REVIEW" : "POST";

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const url = isReview
          ? `http://localhost:8080/api/reviews/${id}`
          : `http://localhost:8080/api/posts/${id}`;

        const response = await axios.get(url);
        setItem(response.data);

        const commentsData = await authFetch(
          `/api/comments?targetType=${commentTargetType}&targetId=${id}`
        );
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } catch (error) {
        console.error("커뮤니티 상세 로딩 실패:", error);
        setItem(null);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, isReview, commentTargetType]);

  const openPostEdit = () => {
    setPostForm({
      title: item?.title || "",
      content: item?.content || "",
    });
    setEditingPost(true);
  };

  const cancelPostEdit = () => {
    setEditingPost(false);
    setPostForm({ title: "", content: "" });
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmittingComment(true);
      const created = await authFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          targetType: commentTargetType,
          targetId: Number(id),
          content: commentText.trim(),
          isAnonymous: commentAnonymous,
        }),
      });

      const ownerEmail = item?.userEmail || item?.authorEmail || "";
      if (ownerEmail && String(ownerEmail).toLowerCase() !== String(currentUserEmail).toLowerCase()) {
        addNotification(ownerEmail, {
          type: "community-comment-added",
          title: "게시글에 댓글이 달렸어요.",
          message: `${getDisplayName({
            email: currentUserEmail,
            nickname: currentUserNickname,
          })}님이 ${BOARD_LABELS[type] || "게시글"}에 댓글을 남겼어요.`,
          actionLabel: "확인하러 가기",
          path: `/community/${type}/${id}`,
        });
      }

      setComments((prev) => [...prev, created]);
      setCommentText("");
      setCommentAnonymous(false);
    } catch (error) {
      console.error("댓글 등록 실패:", error);
      alert(error.message || "댓글 등록에 실패했습니다.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;

    try {
      await authFetch(`/api/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((comment) => Number(comment.id) !== Number(commentId)));
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      alert(error.message || "댓글 삭제에 실패했습니다.");
    }
  };

  const handlePostUpdate = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSavingPost(true);
      const endpoint = isReview ? `/api/reviews/${id}` : `/api/posts/${id}`;
      const updated = await authFetch(endpoint, {
        method: "PATCH",
        body: JSON.stringify({
          ...item,
          title: postForm.title.trim(),
          content: postForm.content.trim(),
        }),
      });

      setItem((prev) => ({
        ...(prev || {}),
        ...(updated || {}),
        title: postForm.title.trim(),
        content: postForm.content.trim(),
      }));
      cancelPostEdit();
      alert("수정되었습니다.");
    } catch (error) {
      console.error("글 수정 실패:", error);
      alert(error.message || "글 수정에 실패했습니다.");
    } finally {
      setSavingPost(false);
    }
  };

  const handlePostDelete = async () => {
    if (!window.confirm("이 글을 삭제할까요?")) return;

    try {
      const endpoint = isReview ? `/api/reviews/${id}` : `/api/posts/${id}`;
      await authFetch(endpoint, { method: "DELETE" });
      alert("삭제되었습니다.");
      navigate("/community");
    } catch (error) {
      console.error("글 삭제 실패:", error);
      alert(error.message || "글 삭제에 실패했습니다.");
    }
  };

  const openCommentEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content || "");
  };

  const cancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleCommentUpdate = async () => {
    if (!editingCommentId) return;
    if (!editingCommentText.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      setSavingComment(true);
      const updated = await authFetch(`/api/comments/${editingCommentId}`, {
        method: "PATCH",
        body: JSON.stringify({ content: editingCommentText.trim() }),
      });

      setComments((prev) =>
        prev.map((comment) =>
          Number(comment.id) === Number(editingCommentId)
            ? { ...comment, ...(updated || {}), content: editingCommentText.trim() }
            : comment
        )
      );
      cancelCommentEdit();
    } catch (error) {
      console.error("댓글 수정 실패:", error);
      alert(error.message || "댓글 수정에 실패했습니다.");
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="page community-detail-page">
        <div className="community-detail-inner">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page community-detail-page">
        <div className="community-detail-inner">
          <div className="detail-top-row">
            <Link to="/community" className="detail-back-link">
              목록으로 돌아가기
            </Link>
          </div>
          <article className="question-card">
            <header className="question-header">
              <div className="question-category">게시글 없음</div>
              <h1 className="question-title">게시글 정보를 불러올 수 없습니다.</h1>
              <div className="question-meta">
                <span>삭제되었거나 접근 권한이 없는 글입니다.</span>
              </div>
            </header>
          </article>
        </div>
      </div>
    );
  }

  const title = item.title || "제목 없음";
  const body = item.content || "내용 없음";
  const authorEmail = item.userEmail || item.authorEmail || null;
  const authorNickname = item.isAnonymous ? "익명" : item.authorNickname || "익명";
  const canOpenAuthorProfile = canOpenUserProfile(authorEmail, item.isAnonymous);
  const myPost =
    Boolean(currentUserEmail) &&
    String(currentUserEmail).toLowerCase() === String(authorEmail || "").toLowerCase();
  const createdAt = item.createdAt ? String(item.createdAt).slice(0, 10) : "";
  const views = item.viewCount ?? 0;
  const likes = item.likeCount ?? 0;
  const canGoFestivalDetail =
    isReview && String(item.targetType || "").toLowerCase() === "festival" && item.targetId;
  const reviewTrustBadges = (() => {
    if (!isReview || item.isAnonymous) return [];
    const badges = Array.isArray(item.authorTrustBadges) ? [...item.authorTrustBadges] : [];
    const companionTrust = getCompanionTrust(authorEmail);

    if (companionTrust.count > 0 && companionTrust.average >= 4) {
      badges.push("친절한 동행자");
    }

    return [...new Set(badges)];
  })();

  const handleAuthorClick = (event) => {
    event.preventDefault();
    if (canOpenAuthorProfile) {
      openUserProfile(navigate, authorEmail);
    }
  };

  return (
    <div className="page community-detail-page">
      <div className="community-detail-inner">
        <div className="detail-top-row">
          <div className="detail-breadcrumb">
            <Link to="/community" className="detail-breadcrumb-link">
              {BOARD_LABELS[type] || "커뮤니티"}
            </Link>
            <span className="detail-breadcrumb-sep">/</span>
            <span>{isReview ? "리뷰 상세" : isFree ? "자유글 상세" : "질문 상세"}</span>
          </div>
          <Link to="/community" className="detail-back-link">
            목록으로 돌아가기
          </Link>
        </div>

        <article className="question-card">
          <header className="question-header">
            <div className="question-category">{CATEGORY_LABELS[type] || "게시글"}</div>
            {editingPost ? (
              <input
                className="community-edit-title"
                value={postForm.title}
                onChange={(event) =>
                  setPostForm((prev) => ({ ...prev, title: event.target.value }))
                }
                disabled={savingPost}
              />
            ) : (
              <h1 className="question-title">{title}</h1>
            )}

            <div className="question-meta">
              <span
                className={`meta-author ${canOpenAuthorProfile ? "clickable" : ""}`}
                onClick={handleAuthorClick}
                style={{ cursor: canOpenAuthorProfile ? "pointer" : "default" }}
              >
                {authorNickname}
              </span>
              {createdAt && (
                <>
                  <span className="meta-dot">·</span>
                  <span>{createdAt}</span>
                </>
              )}
              <span className="meta-dot">·</span>
              <span>조회 {views}</span>
              <span className="meta-dot">·</span>
              <span>공감 {likes}</span>
            </div>

            {canGoFestivalDetail && (
              <div className="community-review-target-link">
                <Link to={`/detail/${item.targetId}`} className="detail-back-link">
                  리뷰 대상 축제 상세 보기
                </Link>
              </div>
            )}

            {isReview && (
              <div className="community-review-target-link" style={{ gap: 6 }}>
                {String(item.targetType || "").toLowerCase() === "festival" ? (
                  <span className="verified-review-badge">방문 인증 리뷰</span>
                ) : null}
                {reviewTrustBadges.map((badge) => (
                  <span key={badge} className="verified-review-badge">
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {myPost && (
              <div className="community-post-actions">
                {editingPost ? (
                  <>
                    <button type="button" onClick={cancelPostEdit} disabled={savingPost}>
                      취소
                    </button>
                    <button type="button" onClick={handlePostUpdate} disabled={savingPost}>
                      {savingPost ? "저장 중..." : "저장"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={openPostEdit}>
                      수정
                    </button>
                    <button type="button" onClick={handlePostDelete}>
                      삭제
                    </button>
                  </>
                )}
              </div>
            )}
          </header>

          <div className="question-body">
            {editingPost ? (
              <textarea
                className="community-edit-content"
                rows={8}
                value={postForm.content}
                onChange={(event) =>
                  setPostForm((prev) => ({ ...prev, content: event.target.value }))
                }
                disabled={savingPost}
              />
            ) : (
              String(body)
                .split("\n")
                .map((line, index) => <p key={index}>{line}</p>)
            )}
          </div>
        </article>

        <section className="community-comments-card">
          <h2 className="community-comments-title">댓글 {comments.length}</h2>

          <div className="community-comment-write">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="댓글을 입력하세요."
              disabled={submittingComment}
            />
            <div className="community-comment-options">
              <label>
                <input
                  type="checkbox"
                  checked={commentAnonymous}
                  onChange={(event) => setCommentAnonymous(event.target.checked)}
                  disabled={submittingComment}
                />
                익명으로 작성하기
              </label>
            </div>
            <button type="button" onClick={handleCommentSubmit} disabled={submittingComment}>
              {submittingComment ? "등록 중..." : "댓글 등록"}
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="community-comments-empty">아직 댓글이 없습니다.</p>
          ) : (
            <div className="community-comments-list">
              {comments.map((comment) => {
                const mine =
                  comment.editableByViewer ||
                  (Boolean(currentUserEmail) &&
                    String(currentUserEmail).toLowerCase() ===
                      String(comment.userEmail || "").toLowerCase());
                const canOpenProfile = canOpenUserProfile(comment.userEmail, comment.isAnonymous);
                const displayName = comment.isAnonymous
                  ? "익명"
                  : comment.userNickname || comment.userEmail || "익명";

                return (
                  <article key={comment.id} className="community-comment-item">
                    <div className="community-comment-meta">
                      <span
                        className={canOpenProfile ? "meta-author clickable" : ""}
                        onClick={() => {
                          if (canOpenProfile) {
                            openUserProfile(navigate, comment.userEmail);
                          }
                        }}
                        style={{ cursor: canOpenProfile ? "pointer" : "default" }}
                      >
                        {displayName}
                      </span>
                      <span>
                        {comment.createdAt
                          ? String(comment.createdAt).slice(0, 16).replace("T", " ")
                          : ""}
                      </span>
                    </div>
                    {mine && Number(editingCommentId) === Number(comment.id) ? (
                      <div className="community-comment-edit-wrap">
                        <textarea
                          value={editingCommentText}
                          onChange={(event) => setEditingCommentText(event.target.value)}
                          disabled={savingComment}
                        />
                      </div>
                    ) : (
                      <p className="community-comment-content">{comment.content}</p>
                    )}
                    {mine && (
                      <div className="community-comment-actions">
                        {Number(editingCommentId) === Number(comment.id) ? (
                          <>
                            <button type="button" onClick={cancelCommentEdit} disabled={savingComment}>
                              취소
                            </button>
                            <button type="button" onClick={handleCommentUpdate} disabled={savingComment}>
                              {savingComment ? "저장 중..." : "저장"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => openCommentEdit(comment)}>
                              수정
                            </button>
                            <button type="button" onClick={() => handleCommentDelete(comment.id)}>
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
