import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReviewWrite.css"; 

const REVIEWS_KEY = "mypage_reviews";

function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReviews(next) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
}

function formatDate(date = new Date()) {
  // YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ReviewWrite() {
  const navigate = useNavigate();

  const [targetType, setTargetType] = useState("festival");
  const [targetTitle, setTargetTitle] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!targetTitle.trim() || !title.trim() || !rating || !content.trim()) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const prev = loadReviews();

    const newReview = {
      id: Date.now(), // 간단/확실한 id
      targetType,
      targetTitle: targetTitle.trim(),
      title: title.trim(),
      rating,
      content: content.trim(),
      createdAt: formatDate(),
    };

    const next = [newReview, ...prev]; // 최신이 위로
    saveReviews(next);

    alert("후기가 등록되었습니다!");
    navigate("/mypage/reviews");
  };

  return (
    <div className="review-write-page">
      <h2>후기 작성</h2>

      <form className="review-write-form" onSubmit={handleSubmit}>
        {/* 대상 타입 */}
        <div className="form-group">
          <label>후기 대상</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          >
            <option value="festival">축제</option>
            <option value="party">파티</option>
            <option value="artgallery">전시</option>
          </select>
        </div>

        {/* 대상 이름 */}
        <div className="form-group">
          <label>{targetType === "festival" ? "축제명" : "파티명"}</label>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
          />
        </div>

        {/* 제목 */}
        <div className="form-group">
          <label>제목</label>
          <input
            type="text"
            placeholder="후기 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 별점 */}
        <div className="form-group">
          <label>별점</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setRating(star);
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* 내용 */}
        <div className="form-group">
          <label>후기 내용</label>
          <textarea
            rows="5"
            placeholder="후기를 작성해주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* 버튼 */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/mypage/reviews")}
          >
            취소
          </button>
          <button type="submit" className="submit-btn">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}
