import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import { removeFestivalLike, replaceLikedFestivals } from "../../utils/likeStorage";

export default function LikeList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncLikesFromServer = async () => {
    try {
      setLoading(true);
      const likes = await authFetch("/api/me/likes");
      const festivalLikes = Array.isArray(likes)
        ? likes.filter((item) => String(item.targetType || "").toLowerCase() === "festival")
        : [];

      if (festivalLikes.length === 0) {
        replaceLikedFestivals([]);
        setItems([]);
        return;
      }

      const params = new URLSearchParams();
      festivalLikes.forEach((item) => {
        params.append("ids", item.targetId);
      });

      const summaries = await authFetch(`/api/festivals/summaries?${params.toString()}`);
      const summaryList = Array.isArray(summaries) ? summaries : [];

      const mapped = summaryList.map((item) => ({
        id: item.id,
        title: item.title || "",
        region: item.region || "",
        location: item.location || "",
        thumbnail_url: item.thumbnailUrl || item.thumbnail_url || "",
        start_date: item.startDate || item.start_date || "",
        end_date: item.endDate || item.end_date || "",
        category: item.category || "",
      }));

      replaceLikedFestivals(mapped);
      setItems(mapped);
    } catch (error) {
      console.error("좋아요 목록 불러오기 실패:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncLikesFromServer();

    window.addEventListener("festival-likes-changed", syncLikesFromServer);
    return () => {
      window.removeEventListener("festival-likes-changed", syncLikesFromServer);
    };
  }, []);

  const handleUnlike = async (e, id) => {
    e.stopPropagation();

    const ok = window.confirm("좋아요를 해제할까요?");
    if (!ok) return;

    try {
      await authFetch(`/api/likes?targetType=festival&targetId=${id}`, {
        method: "DELETE",
      });
      removeFestivalLike(id);
      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (error) {
      console.error("좋아요 해제 실패:", error);
      alert("좋아요 해제에 실패했어요.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    const str = String(value);
    if (str.includes("T")) return str.split("T")[0];
    if (str.length === 8) return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
    return str;
  };

  const getDateText = (item) => {
    const start = formatDate(item.start_date);
    const end = formatDate(item.end_date);

    if (start && end) return `${start} ~ ${end}`;
    if (start) return start;
    if (end) return end;
    return "일정 정보 없음";
  };

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">좋아요 리스트</h2>

      {loading ? (
        <div style={{ padding: 16, color: "#6b7280" }}>좋아요 목록을 불러오는 중이에요.</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 16, color: "#6b7280" }}>아직 좋아요한 행사가 없어요.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/detail/${item.id}`)}
              style={{
                border: "1px solid #f1e4ee",
                borderRadius: 16,
                padding: 14,
                background: "#fff",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 12,
                    background: "#f3f4f6",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}

              <div style={{ fontWeight: 700, fontSize: 16 }}>{item.title}</div>

              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                {item.region || "지역 정보 없음"}
              </div>

              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                {item.location || "장소 정보 없음"}
              </div>

              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                {getDateText(item)}
              </div>

              <button
                type="button"
                onClick={(e) => handleUnlike(e, item.id)}
                style={{
                  marginTop: 12,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid #ffd2e4",
                  background: "#fff9fc",
                  cursor: "pointer",
                  padding: "0 12px",
                  fontWeight: 600,
                }}
              >
                ❤️ 좋아요 해제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
