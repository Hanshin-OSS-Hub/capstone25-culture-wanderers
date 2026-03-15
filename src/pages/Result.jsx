import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { getLikedFestivals, toggleFestivalLike } from "../utils/likeStorage";

export default function Result() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const region = params.get("region") || "전체";
  const date = params.get("date") || "";
  const category = params.get("category") || "전체";
  const q = params.get("q") || "";

  useEffect(() => {
    const syncLikes = () => {
      const likes = getLikedFestivals();
      setLikedIds(new Set(likes.map((item) => String(item.id))));
    };

    syncLikes();
    window.addEventListener("festival-likes-changed", syncLikes);
    window.addEventListener("storage", syncLikes);

    return () => {
      window.removeEventListener("festival-likes-changed", syncLikes);
      window.removeEventListener("storage", syncLikes);
    };
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:3000/api/festivals/search${search}`);
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("검색 결과 불러오기 실패:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [search]);

  const handleGoSearch = () => {
    const next = new URLSearchParams();
    if (region && region !== "전체") next.set("region", region);
    if (date) next.set("date", date);
    if (category && category !== "전체") next.set("category", category);
    if (q) next.set("q", q);
    navigate(`/result?${next.toString()}`);
  };

  const handleToggleLike = (e, festival) => {
    e.stopPropagation();
    toggleFestivalLike(festival);

    const likes = getLikedFestivals();
    setLikedIds(new Set(likes.map((item) => String(item.id))));
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return "일정 정보 없음";

    const format = (value) => {
      if (!value) return "";
      if (String(value).includes("T")) return String(value).split("T")[0];
      if (String(value).length === 8) {
        return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
      }
      return value;
    };

    const start = format(startDate);
    const end = format(endDate);

    if (start && end) return `${start} ~ ${end}`;
    return start || end || "일정 정보 없음";
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>검색 결과</h2>

      <div style={{ marginBottom: 12, color: "#666" }}>
        조건: {region} / {date || "날짜없음"} / {category} {q ? `/ "${q}"` : ""}
      </div>

      {loading ? (
        <div>불러오는 중...</div>
      ) : results.length === 0 ? (
        <div>검색 결과가 없습니다.</div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>총 {results.length}개</div>

          <div
            className="festival-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {results.map((f) => {
              const liked = likedIds.has(String(f.id));

              return (
                <div
                  key={f.id}
                  className="festival-card"
                  onClick={() => navigate(`/detail/${f.id}`)}
                  style={{
                    position: "relative",
                    border: "1px solid #eee",
                    borderRadius: 16,
                    padding: 12,
                    background: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(e, f)}
                    aria-label={liked ? "좋아요 해제" : "좋아요 추가"}
                    title={liked ? "좋아요 해제" : "좋아요 추가"}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 40,
                      height: 40,
                      border: "none",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.92)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      cursor: "pointer",
                      fontSize: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {liked ? "❤️" : "🤍"}
                  </button>

                  <img
                    src={f.thumbnail_url}
                    alt={f.title}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 12,
                      background: "#f3f4f6",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div style={{ fontWeight: 700, marginTop: 10, fontSize: 17 }}>{f.title}</div>
                  <div style={{ color: "#666", fontSize: 14, marginTop: 6 }}>{f.region}</div>
                  <div style={{ color: "#666", fontSize: 14, marginTop: 4 }}>{f.location}</div>
                  <div style={{ color: "#999", fontSize: 13, marginTop: 8 }}>
                    {formatDateRange(f.start_date, f.end_date)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}