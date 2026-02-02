// src/pages/MyPage/LikeList.jsx
import React, { useState } from "react";

//  프론트 완성용 더미 데이터
const initialItems = [
  { id: 1, title: "서울 불꽃축제(더미)", region: "서울", date: "2026-10-03" },
  { id: 2, title: "부산 야시장(더미)", region: "부산", date: "2026-04-12" },
  { id: 3, title: "대구 재즈 페스티벌(더미)", region: "대구", date: "2026-05-20" },
];

export default function LikeList() {
  const [items, setItems] = useState(initialItems);

  const handleUnlike = (id) => {
    const ok = window.confirm("좋아요를 해제할까요?");
    if (!ok) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">좋아요 리스트</h2>

      {items.length === 0 ? (
        <div style={{ padding: 16, color: "#6b7280" }}>
          아직 좋아요한 행사가 없어요.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #f1e4ee",
                borderRadius: 14,
                padding: 14,
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                {item.region} · {item.date}
              </div>

              <button
                type="button"
                onClick={() => handleUnlike(item.id)}
                style={{
                  marginTop: 12,
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid #ffd2e4",
                  background: "#fff9fc",
                  cursor: "pointer",
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
