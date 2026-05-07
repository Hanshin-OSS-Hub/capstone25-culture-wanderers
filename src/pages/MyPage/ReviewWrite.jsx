import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import "./ReviewWrite.css";

export default function ReviewWrite() {
  const navigate = useNavigate();
  const location = useLocation();

  const [targetId, setTargetId] = useState(null);
  const [targetTitle, setTargetTitle] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reviewTarget = location.state || {
      targetType: params.get("targetType"),
      targetId: params.get("targetId"),
      targetTitle: params.get("targetTitle"),
    };

    if (reviewTarget?.targetType && reviewTarget.targetType !== "festival") {
      alert("파티 후기는 파티 상세 화면에서 작성할 수 있어요. 이 화면에서는 축제 후기만 작성할 수 있습니다.");
      navigate("/mypage/reviews", { replace: true });
      return;
    }

    if (reviewTarget?.targetId) setTargetId(reviewTarget.targetId);
    if (reviewTarget?.targetTitle) setTargetTitle(reviewTarget.targetTitle);
  }, [location.search, location.state, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!targetTitle.trim() || !title.trim() || !rating || !content.trim()) {
      alert("행사명, 제목, 별점, 후기 내용을 모두 입력해주세요.");
      return;
    }

    if (!targetId) {
      alert("후기 대상 행사를 찾을 수 없어요. 행사 상세에서 '다녀왔어요'를 누른 뒤 다시 작성해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      await authFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          targetType: "festival",
          targetId: Number(targetId),
          targetTitle: targetTitle.trim(),
          title: title.trim(),
          rating: Number(rating),
          content: content.trim(),
          isAnonymous,
        }),
      });

      navigate("/mypage/reviews", {
        state: {
          notice: "방문 인증 후기가 등록되었어요.",
        },
      });
    } catch (err) {
      console.error("후기 등록 실패:", err);
      alert(err?.message || "후기 등록에 실패했어요. '다녀왔어요' 기록이 있는 행사만 리뷰를 작성할 수 있습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-write-page">
      <h2>축제 후기 작성</h2>
      <p className="review-write-guide">
        다녀왔어요로 방문 인증한 행사만 리뷰를 작성할 수 있어요.
      </p>

      <form className="review-write-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>후기 대상</label>
          <select value="festival" disabled>
            <option value="festival">축제</option>
          </select>
        </div>

        <div className="form-group">
          <label>행사명</label>
          <input
            type="text"
            placeholder="행사명을 입력하세요"
            value={targetTitle}
            onChange={(event) => setTargetTitle(event.target.value)}
            disabled={isSubmitting || Boolean(targetId)}
          />
        </div>

        <div className="form-group">
          <label>제목</label>
          <input
            type="text"
            placeholder="후기 제목을 입력하세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label>별점</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? "active" : ""}`}
                onClick={() => !isSubmitting && setRating(star)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (!isSubmitting && (event.key === "Enter" || event.key === " ")) {
                    setRating(star);
                  }
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
              disabled={isSubmitting}
            />
            익명으로 작성하기
          </label>
        </div>

        <div className="form-group">
          <label>후기 내용</label>
          <textarea
            rows="5"
            placeholder="방문 경험을 바탕으로 후기를 작성해주세요"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/mypage/reviews")}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
