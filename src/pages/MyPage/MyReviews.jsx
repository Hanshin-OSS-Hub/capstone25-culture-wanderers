import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyReviews.css"; 

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

export default function MyReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);

  // 최초 로드
  useEffect(() => {
    const stored = loadReviews();

    // 처음 시작할 때 샘플 2개 넣고 싶으면 아래 주석 해제
    // if (stored.length === 0) {
    //   const seeded = [
    //     {
    //       id: 1,
    //       targetType: "festival",
    //       targetTitle: "홍대 거리 축제",
    //       title: "분위기 최고였어요!",
    //       rating: 5,
    //       content: "사람은 많았지만 공연이 정말 좋았습니다.",
    //       createdAt: "2026-02-01",
    //     },
    //     {
    //       id: 2,
    //       targetType: "party",
    //       targetTitle: "부산 불꽃 파티",
    //       title: "뷰는 좋은데 조금 혼잡",
    //       rating: 3,
    //       content: "불꽃은 예뻤지만 사람이 너무 많았어요.",
    //       createdAt: "2026-01-20",
    //     },
    //   ];
    //   saveReviews(seeded);
    //   setReviews(seeded);
    //   return;
    // }

    // 최신순 정렬(선택)
    const sorted = stored
      .slice()
      .sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
    setReviews(sorted);
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("후기를 삭제할까요?")) return;

    const next = reviews.filter((r) => r.id !== id);
    setReviews(next);
    saveReviews(next);
  };

  return (
    <div className="myreviews-page">
      {/* 헤더 */}
      <div className="myreviews-header">
        <h2>내 후기</h2>
        <button
          className="review-write-btn"
          onClick={() => navigate("/mypage/reviews/new")}
        >
          ✏️ 후기 작성
        </button>
      </div>

      {/* 목록 */}
      {reviews.length === 0 ? (
        <p className="empty-text">아직 작성한 후기가 없습니다. 첫 후기를 작성해보세요!</p>
      ) : (
        <div className="review-card-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-card-header">
                <span className="review-target">
                  {review.targetType === "festival" ? "🎪 축제" : "🎉 파티"} ·{" "}
                  {review.targetTitle}
                </span>
                <span className="review-date">
                  {review.updatedAt ? `${review.updatedAt} (수정됨)` : review.createdAt}
                </span>
              </div>

              <h3 className="review-title">{review.title}</h3>

              <div className="review-rating">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>

              <p className="review-content">{review.content}</p>

              <div className="review-actions">
                <button
                  className="edit-btn"
                  onClick={() => navigate(`/mypage/reviews/${review.id}/edit`)}
                >
                  수정
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(review.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
