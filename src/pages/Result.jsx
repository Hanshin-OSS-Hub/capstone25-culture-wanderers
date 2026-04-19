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
  const companion = params.get("companion") || "";
  const freeOnly = params.get("free") === "1";
  const maxPrice = params.get("maxPrice") || "";

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
    if (companion) next.set("companion", companion);
    if (freeOnly) next.set("free", "1");
    if (maxPrice) next.set("maxPrice", maxPrice);

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

  const recommendationReasons = useMemo(() => {
    const reasons = [];

    if (region !== "전체") {
      reasons.push(`${region}에서 찾기 쉬운 행사를 우선 추천했어요.`);
    }

    if (freeOnly) {
      reasons.push("학생 예산 부담이 적은 무료 행사 위주로 보여드려요.");
    } else if (maxPrice) {
      reasons.push(`${Number(maxPrice).toLocaleString()}원 이하에서 즐길 수 있는 행사 위주로 골랐어요.`);
    }

    if (companion === "혼자") {
      reasons.push("전시·체험형처럼 혼자 방문하기 편한 행사도 함께 고려했어요.");
    } else if (companion === "친구") {
      reasons.push("친구와 같이 가기 좋은 축제·공연형 행사를 우선 추천했어요.");
    } else if (companion === "데이트") {
      reasons.push("데이트 분위기에 어울리는 전시·공연 중심으로 추천해드려요.");
    }

    if (category !== "전체") {
      reasons.push(`${category} 카테고리를 우선 반영해서 결과를 정리했어요.`);
    }

    if (q) {
      reasons.push(`"${q}" 키워드와 관련된 행사를 함께 반영했어요.`);
    }

    if (reasons.length === 0) {
      reasons.push("입력한 조건이 없어 인기 행사와 접근성 좋은 행사를 중심으로 추천했어요.");
      reasons.push("학생이 부담 없이 즐길 수 있는 행사부터 우선 확인할 수 있어요.");
    }

    return reasons.slice(0, 3);
  }, [region, freeOnly, maxPrice, companion, category, q]);

  return (
    <div style={{ padding: 24 }}>
      <h2>검색 결과</h2>

      <div style={{ marginBottom: 12, color: "#666" }}>
        조건: {region} / {date || "날짜없음"} / {category}
        {q ? ` / "${q}"` : ""}
        {companion ? ` / ${companion}와 함께` : ""}
        {freeOnly ? " / 무료만" : ""}
        {maxPrice ? ` / 0원~${Number(maxPrice).toLocaleString()}원` : ""}
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: 18,
          borderRadius: 16,
          background: "#fff4f8",
          border: "1px solid #ffd3e1",
          boxShadow: "0 6px 18px rgba(255, 120, 160, 0.08)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: "#ff5c8a" }}>
          AI 추천 이유
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#555", lineHeight: 1.8 }}>
          {recommendationReasons.map((reason, idx) => (
            <li key={idx}>{reason}</li>
          ))}
        </ul>
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