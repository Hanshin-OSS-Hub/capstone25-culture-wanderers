// src/pages/MyPage/PartyHistory.jsx
import React from "react";

// 프론트 완성용 더미 데이터
const parties = [
  { id: 1, name: "서울 불꽃 파티(더미)", date: "2026-10-03", status: "진행중" },
  { id: 2, name: "부산 야시장 투어(더미)", date: "2026-04-12", status: "종료" },
];

export default function PartyHistory() {
  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">참여한 파티</h2>

      <div style={{ display: "grid", gap: 10 }}>
        {parties.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #f1e4ee",
              borderRadius: 12,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                {p.date}
              </div>
            </div>

            <span style={badgeStyle(p.status)}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function badgeStyle(status) {
  const base = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #f1e4ee",
  };
  if (status === "진행중") {
    return { ...base, background: "#fff3f8", color: "#ff538b" };
  }
  return { ...base, background: "#f9fafb", color: "#6b7280" };
}
