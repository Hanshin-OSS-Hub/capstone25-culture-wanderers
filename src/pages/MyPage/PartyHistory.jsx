// src/pages/MyPage/PartyHistory.jsx
import React from "react";

export default function PartyHistory() {
  // 현재는 백엔드 연동 전이라 빈 배열
  const parties = [];

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">참여한 파티</h2>

      {parties.length === 0 ? (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "#6b7280",
            border: "1px solid #f1e4ee",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          참여한 파티가 없습니다
        </div>
      ) : (
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
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {p.date}
                </div>
              </div>

              <span style={badgeStyle(p.status)}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
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