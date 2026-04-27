import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import "./MyPage.css";

function formatVisitedDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export default function VisitedFestivals() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await authFetch("/api/me/visited-festivals");
        setVisits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("방문 행사 전체 조회 실패:", err);
        setError("방문 행사 기록을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    loadVisits();
  }, []);

  if (loading) {
    return <div className="mypage-main-panel">방문 행사 기록을 불러오는 중이에요.</div>;
  }

  if (error) {
    return <div className="mypage-main-panel">{error}</div>;
  }

  return (
    <section className="mypage-main-panel">
      <div className="journey-history-header visited-page-header">
        <div>
          <h2 className="mypage-section-title">다녀온 행사 전체 보기</h2>
          <div className="journey-history-subtitle">
            지금까지 다녀온 문화행사를 한 번에 볼 수 있어요.
          </div>
        </div>
        <button
          type="button"
          className="mypage-main-edit-btn"
          onClick={() => navigate("/mypage")}
        >
          마이페이지로
        </button>
      </div>

      {visits.length === 0 ? (
        <div className="journey-empty-state">아직 다녀온 행사 기록이 없어요.</div>
      ) : (
        <div className="journey-visit-list full">
          {visits.map((visit) => (
            <button
              type="button"
              className="journey-visit-item"
              key={`${visit.festivalId}-${visit.visitedAt}`}
              onClick={() => visit.festivalId && navigate(`/detail/${visit.festivalId}`)}
            >
              <div>
                <div className="journey-visit-title">
                  {visit.festivalTitle || "행사명이 없는 기록"}
                </div>
                <div className="journey-visit-meta">
                  방문일 {formatVisitedDate(visit.visitedAt)}
                </div>
              </div>
              <span>상세 보기</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
