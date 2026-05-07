import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../api/authFetch";
import SavedFestivalCard from "../../components/SavedFestivalCard";

export default function FollowingSaveList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await authFetch("/api/me/following-saved-festivals");
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("팔로우 저장목록 로딩 실패:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">팔로우 저장목록</h2>
      <p style={{ margin: "8px 0 18px", color: "#6b7280", fontSize: 13 }}>
        내가 팔로잉한 사람들이 저장한 축제를 모아봤어요.
      </p>

      {loading ? (
        <div style={{ padding: 16, color: "#6b7280" }}>저장목록을 불러오는 중입니다.</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 16, color: "#6b7280" }}>
          팔로잉한 사용자의 저장 축제가 아직 없습니다.
        </div>
      ) : (
        <div className="saved-festival-list">
          {items.map((festival, index) => (
            <SavedFestivalCard
              key={`${festival.savedByEmail}-${festival.id}-${index}`}
              festival={festival}
              showSavedBy
              onClick={() => navigate(`/detail/${festival.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
