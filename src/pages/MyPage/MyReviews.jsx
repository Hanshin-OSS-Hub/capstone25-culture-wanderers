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
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await authFetch("/api/me/reviews");

        const reviewList = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];

        const sorted = reviewList
          .slice()
          .sort((a, b) =>
            (b.updatedAt || b.createdAt || "").localeCompare(
              a.updatedAt || a.createdAt || ""
            )
          );

        setReviews(sorted);
      } catch (err) {
        console.error("내 후기 조회 실패:", err);
        setError("내 후기 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    const fetchFestivals = async () => {
      try {
        const data = await authFetch("/api/me/visited-festivals");

        const visitedList = Array.isArray(data)
          ? data.map((item) => ({
            id: item.festivalId,
            title: item.festivalTitle,
          }))
          : [];

        setFestivalList(visitedList);

        setFestivalList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("축제 목록 조회 실패:", err);
      }
    };

    fetchFestivals();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("후기를 삭제할까요?")) return;

    try {
      await authFetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });

      setReviews((prev) => prev.filter((r) => Number(r.id) !== Number(id)));
      alert("후기가 삭제되었습니다.");
    } catch (err) {
      console.error("후기 삭제 실패:", err);
      alert("후기 삭제에 실패했습니다.");
    }
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
        <h2>내 후기</h2>
        <select
          className="review-target-select"
          value={selectedFestivalId}
          onChange={(e) => setSelectedFestivalId(e.target.value)}
        >
          <option value="">후기 작성할 행사 선택</option>
          {festivalList.map((festival) => (
            <option
              key={festival.festivalId || festival.id}
              value={festival.festivalId || festival.id}
            >
              {festival.festivalTitle || festival.title}
            </option>
          ))}
        </select>

        <button
          className="review-write-btn"
          onClick={() => {
            const selectedFestival = festivalList.find(
              (festival) =>
                String(festival.festivalId || festival.id) === String(selectedFestivalId)
            );

            navigate("/mypage/reviews/new", {
              state: {
                targetType: "festival",
                targetId: selectedFestival.festivalId || selectedFestival.id,
                targetTitle: selectedFestival.festivalTitle || selectedFestival.title,
              },
            });
          }}
        >
          후기 작성
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="empty-text">
          아직 작성한 후기가 없습니다. 첫 후기를 작성해보세요!
        </p>
      ) : (
        <div className="review-card-list">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="review-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/community/review/${review.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/community/review/${review.id}`);
                }
              }}
            >
              <div className="review-card-header">
                <span className="review-target">
                  {review.targetType === "festival" ? "축제" : "파티"} ·{" "}
                  {review.targetTitle}
                </span>
                <span className="review-date">
                  {review.updatedAt
                    ? `${review.updatedAt} (수정됨)`
                    : review.createdAt}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/mypage/reviews/${review.id}/edit`);
                  }}
                >
                  수정
                </button>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
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
