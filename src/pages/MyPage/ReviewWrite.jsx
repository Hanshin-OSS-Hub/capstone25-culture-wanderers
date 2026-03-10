import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../api/authFetch";
import "./ReviewWrite.css";

export default function ReviewWrite() {
  const navigate = useNavigate();

  const [targetType, setTargetType] = useState("festival");
  const [targetTitle, setTargetTitle] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!targetTitle.trim() || !title.trim() || !rating || !content.trim()) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const payload = {
      targetType,
      targetTitle: targetTitle.trim(),
      title: title.trim(),
      rating,
      content: content.trim(),
    };

    try {
      setIsSubmitting(true);

      await authFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("후기가 등록되었습니다!");
      navigate("/mypage/reviews");
    } catch (err) {
      console.error("후기 등록 실패:", err);
      alert("후기 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-write-page">
      <h2>후기 작성</h2>

      <form className="review-write-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>후기 대상</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="festival">축제</option>
            <option value="party">파티</option>
            <option value="artgallery">전시</option>
          </select>
        </div>

        <div className="form-group">
          <label>{targetType === "festival" ? "축제명" : "파티명"}</label>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label>제목</label>
          <input
            type="text"
            placeholder="후기 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
                onKeyDown={(e) => {
                  if (!isSubmitting && (e.key === "Enter" || e.key === " ")) {
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
            onChange={(e) => setContent(e.target.value)}
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