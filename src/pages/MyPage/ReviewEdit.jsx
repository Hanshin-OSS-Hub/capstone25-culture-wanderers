import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ReviewWrite.css"; // ReviewWrite.css 재사용

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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ReviewEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const reviewId = Number(id);

  const [found, setFound] = useState(null);
  const [loading, setLoading] = useState(true);

  // 폼 상태
  const [targetType, setTargetType] = useState("festival");
  const [targetTitle, setTargetTitle] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  // ✅ localStorage에서 id로 찾고 폼 초기값 세팅
  useEffect(() => {
    const all = loadReviews();
    const item = all.find((r) => Number(r.id) === reviewId);

    if (!item) {
      setFound(null);
      setLoading(false);
      return;
    }

    setFound(item);
    setTargetType(item.targetType);
    setTargetTitle(item.targetTitle);
    setTitle(item.title);
    setRating(item.rating);
    setContent(item.content);
    setLoading(false);
  }, [reviewId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!targetTitle.trim() || !title.trim() || !rating || !content.trim()) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const all = loadReviews();
    const idx = all.findIndex((r) => Number(r.id) === reviewId);

    if (idx === -1) {
      alert("수정할 후기를 찾을 수 없습니다.");
      navigate("/mypage/reviews");
      return;
    }

    const updated = {
      ...all[idx],
      targetType,
      targetTitle: targetTitle.trim(),
      title: title.trim(),
      rating,
      content: content.trim(),
      updatedAt: formatDate(),
    };

    const next = all.slice();
    next[idx] = updated;

    saveReviews(next);

    alert("후기가 수정되었습니다!");
    navigate("/mypage/reviews");
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
        {/* 대상 타입 */}
        <div className="form-group">
          <label>후기 대상</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          >
            <option value="festival">축제</option>
            <option value="party">파티</option>
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
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
