import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { authFetch } from "../api/authFetch";
import { addNotification, getDisplayName } from "../utils/notificationStorage";
import "./Community.css";

export default function CommunityDetail() {
  const { id, type } = useParams();
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [savingPost, setSavingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUserEmail =
    localStorage.getItem("loggedInUser") || sessionStorage.getItem("loggedInUser") || "";
  const currentUserNickname =
    localStorage.getItem("nickname") || sessionStorage.getItem("nickname") || "";

  const commentTargetType = type === "review" ? "REVIEW" : "POST";

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

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const isReview = type === "review";
        const url = isReview
          ? `http://localhost:8080/api/reviews/${id}`
          : `http://localhost:8080/api/posts/${id}`;

        const response = await axios.get(url);
        setItem(response.data);

        const commentsResponse = await axios.get(
          `http://localhost:8080/api/comments?targetType=${commentTargetType}&targetId=${id}`
        );
        setComments(Array.isArray(commentsResponse.data) ? commentsResponse.data : []);
      } catch (e) {
        console.error("커뮤니티 상세 로딩 실패:", e);
        setItem(null);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, type, commentTargetType]);

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
        }),
      });

      const ownerEmail = item?.userEmail || item?.authorEmail || "";
      if (ownerEmail && String(ownerEmail).toLowerCase() !== String(currentUserEmail).toLowerCase()) {
        const boardLabel = type === "review" ? "리뷰 게시판" : type === "free" ? "자유게시판" : "질문 게시판";
        addNotification(ownerEmail, {
          type: "community-comment-added",
          title: "내 게시글에 새 댓글이 달렸어요",
          message: `${getDisplayName({ email: currentUserEmail, nickname: currentUserNickname })}님이 ${boardLabel}에 댓글을 남겼어요.`,
          actionLabel: "확인하러 가기",
          path: `/community/${type}/${id}`,
        });
      }

      setComments((prev) => [...prev, created]);
      setCommentText("");
    } catch (e) {
      console.error("댓글 등록 실패:", e);
      alert(e.message || "댓글 등록에 실패했습니다.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;

    try {
      await authFetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      setComments((prev) => prev.filter((c) => Number(c.id) !== Number(commentId)));
    } catch (e) {
      console.error("댓글 삭제 실패:", e);
      alert(e.message || "댓글 삭제에 실패했습니다.");
    }
  };

  const handlePostUpdate = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSavingPost(true);
      const endpoint = type === "review" ? `/api/reviews/${id}` : `/api/posts/${id}`;

      const updated = await authFetch(endpoint, {
        method: "PATCH",
        body: JSON.stringify({
          ...item,
          title: postForm.title.trim(),
          content: postForm.content.trim(),
        }),
      });

      setItem((prev) => ({ ...(prev || {}), ...(updated || {}), title: postForm.title.trim(), content: postForm.content.trim() }));
      cancelPostEdit();
      alert("수정되었습니다.");
    } catch (e) {
      console.error("글 수정 실패:", e);
      alert(e.message || "글 수정에 실패했습니다.");
    } finally {
      setSavingPost(false);
    }
  };

  const handlePostDelete = async () => {
    if (!window.confirm("이 글을 삭제할까요?")) return;

    try {
      const endpoint = type === "review" ? `/api/reviews/${id}` : `/api/posts/${id}`;
      await authFetch(endpoint, { method: "DELETE" });
      alert("삭제되었습니다.");
      window.location.href = "/community";
    } catch (e) {
      console.error("글 삭제 실패:", e);
      alert(e.message || "글 삭제에 실패했습니다.");
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
        prev.map((c) => (Number(c.id) === Number(editingCommentId) ? { ...c, ...(updated || {}), content: editingCommentText.trim() } : c))
      );
      cancelCommentEdit();
    } catch (e) {
      console.error("댓글 수정 실패:", e);
      alert(e.message || "댓글 수정에 실패했습니다.");
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
            <div className="detail-breadcrumb">
              <Link to="/community" className="detail-breadcrumb-link">
                커뮤니티
              </Link>
              <span className="detail-breadcrumb-sep">›</span>
              <span>상세</span>
            </div>
            <Link to="/community" className="detail-back-link">
              목록으로 돌아가기
            </Link>
          </div>

          <article className="question-card">
            <header className="question-header">
              <div className="question-category">게시글 없음</div>
              <h1 className="question-title">게시글 정보를 불러올 수 없습니다.</h1>
              <div className="question-meta">
                <span>삭제되었거나 접근 권한이 없습니다.</span>
              </div>
            </header>
          </article>
        </div>
      </div>
    );
  }

  const isReview = type === "review";
  const isFree = type === "free";
  const breadcrumbLabel = isReview
    ? "리뷰 게시판"
    : isFree
    ? "자유게시판"
    : "질문 게시판";
  const title = item.title || "제목 없음";
  const body = item.content || "내용 없음";
  const category = isReview ? "리뷰" : isFree ? "자유" : "질문";
  const author = item.userEmail || item.authorEmail || "익명";
  const myPost =
    !!currentUserEmail &&
    String(currentUserEmail).toLowerCase() === String(author).toLowerCase();
  const createdAt = item.createdAt ? String(item.createdAt).slice(0, 10) : "";
  const views = item.viewCount ?? 0;
  const likes = item.likeCount ?? 0;
  const canGoFestivalDetail =
    isReview &&
    String(item.targetType || "").toLowerCase() === "festival" &&
    item.targetId;

  return (
    <div className="page community-detail-page">
      <div className="community-detail-inner">
        <div className="detail-top-row">
          <div className="detail-breadcrumb">
            <Link to="/community" className="detail-breadcrumb-link">
              {breadcrumbLabel}
            </Link>
            <span className="detail-breadcrumb-sep">›</span>
            <span>{isReview ? "리뷰 상세" : isFree ? "자유글 상세" : "질문 상세"}</span>
          </div>
          <Link to="/community" className="detail-back-link">
            목록으로 돌아가기
          </Link>
        </div>

        <article className="question-card">
          <header className="question-header">
            <div className="question-category">{category}</div>
            {editingPost ? (
              <input
                className="community-edit-title"
                value={postForm.title}
                onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                disabled={savingPost}
              />
            ) : (
              <h1 className="question-title">{title}</h1>
            )}

            <div className="question-meta">
              <span className="meta-author">{author}</span>
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
                  리뷰 쓴 축제 상세 보러가기
                </Link>
              </div>
            )}

            {myPost && (
              <div className="community-post-actions">
                {editingPost ? (
                  <>
                    <button type="button" onClick={cancelPostEdit} disabled={savingPost}>취소</button>
                    <button type="button" onClick={handlePostUpdate} disabled={savingPost}>
                      {savingPost ? "저장 중..." : "저장"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={openPostEdit}>수정</button>
                    <button type="button" onClick={handlePostDelete}>삭제</button>
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
                onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                disabled={savingPost}
              />
            ) : (
              String(body)
                .split("\n")
                .map((line, idx) => <p key={idx}>{line}</p>)
            )}
          </div>
        </article>

        <section className="community-comments-card">
          <h2 className="community-comments-title">댓글 {comments.length}</h2>

          <div className="community-comment-write">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요"
              disabled={submittingComment}
            />
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
                  currentUserEmail &&
                  String(currentUserEmail).toLowerCase() ===
                    String(comment.userEmail || "").toLowerCase();

                return (
                  <article key={comment.id} className="community-comment-item">
                    <div className="community-comment-meta">
                      <span>{comment.userNickname || comment.userEmail || "익명"}</span>
                      <span>{comment.createdAt ? String(comment.createdAt).slice(0, 16).replace("T", " ") : ""}</span>
                    </div>
                    {mine && Number(editingCommentId) === Number(comment.id) ? (
                      <div className="community-comment-edit-wrap">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
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
                            <button type="button" onClick={cancelCommentEdit} disabled={savingComment}>취소</button>
                            <button type="button" onClick={handleCommentUpdate} disabled={savingComment}>
                              {savingComment ? "저장 중..." : "저장"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => openCommentEdit(comment)}>수정</button>
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
