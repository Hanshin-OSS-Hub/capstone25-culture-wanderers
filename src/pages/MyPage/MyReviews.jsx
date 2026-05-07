import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import "./MyReviews.css";

export default function MyReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [festivalList, setFestivalList] = useState([]);
  const [selectedFestivalId, setSelectedFestivalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [reviewData, visitedData] = await Promise.all([
          authFetch("/api/me/reviews"),
          authFetch("/api/me/visited-festivals").catch(() => []),
        ]);

        const reviewList = Array.isArray(reviewData)
          ? reviewData
          : Array.isArray(reviewData?.data)
          ? reviewData.data
          : [];

        setReviews(
          reviewList
            .filter((review) => String(review.targetType || "").toLowerCase() !== "party")
            .slice()
            .sort((a, b) =>
              (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || "")
            )
        );

        const visitedList = Array.isArray(visitedData)
          ? visitedData.map((item) => ({
              id: item.festivalId || item.id,
              title: item.festivalTitle || item.title,
            }))
          : [];

        setFestivalList(visitedList);
      } catch (err) {
        console.error("내 후기 조회 실패:", err);
        setError("내 후기 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("후기를 삭제할까요?")) return;

    try {
      await authFetch(`/api/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((review) => Number(review.id) !== Number(id)));
      alert("후기가 삭제되었습니다.");
    } catch (err) {
      console.error("후기 삭제 실패:", err);
      alert("후기 삭제에 실패했습니다.");
    }
  };

  const openReviewWriter = () => {
    const selectedFestival = festivalList.find(
      (festival) => String(festival.id) === String(selectedFestivalId)
    );

    if (!selectedFestival) {
      alert("후기를 작성할 축제를 선택해주세요.");
      return;
    }

    navigate(
      `/mypage/reviews/new?targetType=festival&targetId=${encodeURIComponent(selectedFestival.id)}&targetTitle=${encodeURIComponent(selectedFestival.title)}`,
      {
        state: {
          targetType: "festival",
          targetId: selectedFestival.id,
          targetTitle: selectedFestival.title,
        },
      }
    );
  };

  if (loading) {
    return <div className="myreviews-page">후기를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="myreviews-page">{error}</div>;
  }

  return (
    <div className="myreviews-page">
      <div className="myreviews-header">
        <h2>내 축제 후기</h2>
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 420 }}>
          <select
            className="review-target-select"
            value={selectedFestivalId}
            onChange={(event) => setSelectedFestivalId(event.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">축제 후기 대상 선택</option>
            {festivalList.map((festival) => (
              <option key={festival.id} value={festival.id}>
                {festival.title}
              </option>
            ))}
          </select>

          <button className="review-write-btn" onClick={openReviewWriter}>
            축제 후기 작성
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="empty-text">아직 작성한 축제 후기가 없습니다.</p>
      ) : (
        <div className="review-card-list">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="review-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/community/review/${review.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/community/review/${review.id}`);
                }
              }}
            >
              <div className="review-card-header">
                <span className="review-target">축제 · {review.targetTitle}</span>
                <span className="review-date">
                  {review.updatedAt ? `${review.updatedAt} (수정됨)` : review.createdAt}
                </span>
              </div>

              <h3 className="review-title">{review.title}</h3>

              <div className="review-rating">
                {"★".repeat(review.rating || 0)}
                {"☆".repeat(5 - (review.rating || 0))}
              </div>

              <p className="review-content">{review.content}</p>

              <div className="review-actions">
                <button
                  className="edit-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/mypage/reviews/${review.id}/edit`);
                  }}
                >
                  수정
                </button>
                <button
                  className="delete-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(review.id);
                  }}
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
