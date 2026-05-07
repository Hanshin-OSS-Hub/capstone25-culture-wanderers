import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import "./ReviewWrite.css";

export default function ReviewEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const reviewId = Number(id);

  const [found, setFound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [targetTitle, setTargetTitle] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);

        const review = await authFetch(`/api/reviews/${reviewId}`);

        if (!review) {
          setFound(null);
          return;
        }

        if (String(review.targetType || "").toLowerCase() === "party") {
          alert("파티 후기는 동행 평가로 바뀌었어요.");
          navigate("/mypage/reviews", { replace: true });
          return;
        }

        setFound(review);
        setTargetTitle(review.targetTitle || "");
        setTitle(review.title || "");
        setRating(review.rating || 0);
        setContent(review.content || "");
      } catch (err) {
        console.error("후기 상세 조회 실패:", err);
        setFound(null);
      } finally {
        setLoading(false);
      }
    };

    if (!reviewId) {
      setFound(null);
      setLoading(false);
      return;
    }

    fetchReview();
  }, [navigate, reviewId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim() || !rating || !content.trim()) {
      alert("제목, 별점, 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      await authFetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          rating,
          content: content.trim(),
        }),
      });

      alert("후기가 수정되었습니다.");
      navigate("/mypage/reviews");
    } catch (err) {
      console.error("후기 수정 실패:", err);
      alert("후기 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <h2>후기 수정</h2>
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!found) {
    return (
      <div style={{ padding: 16 }}>
        <h2>후기 수정</h2>
        <p>해당 후기(id: {id})를 찾을 수 없습니다.</p>
        <button onClick={() => navigate("/mypage/reviews")}>목록으로</button>
      </div>
    );
  }

  return (
    <div className="review-write-page">
      <h2>후기 수정</h2>

      <form className="review-write-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>후기 대상</label>
          <input type="text" value="축제" disabled />
        </div>

        <div className="form-group">
          <label>축제명</label>
          <input type="text" value={targetTitle} disabled />
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
          <label>후기 내용</label>
          <textarea
            rows="5"
            placeholder="후기를 작성해주세요"
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
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
