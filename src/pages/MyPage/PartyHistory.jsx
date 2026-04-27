// src/pages/MyPage/PartyHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../api/authFetch";

export default function PartyHistory() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await authFetch("/api/me/parties");
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setParties(list);
      } catch (e) {
        console.error("참여한 파티 조회 실패:", e);
        setError("참여한 파티를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, []);

  if (loading) {
    return <div className="mypage-main-panel">참여한 파티를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="mypage-main-panel">{error}</div>;
  }

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
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/party/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/party/${p.id}`);
                }
              }}
              style={{
                border: "1px solid #f1e4ee",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{p.title || "파티"}</div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {p.meetingTime ? String(p.meetingTime).replace("T", " ").slice(0, 16) : "일정 없음"}
                </div>
                {p.festivalId ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/detail/${p.festivalId}`);
                    }}
                    style={{
                      marginTop: 8,
                      border: "1px solid #ffd3e3",
                      background: "#fff9fc",
                      color: "#ff538b",
                      borderRadius: 8,
                      padding: "4px 8px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    축제 상세 보기
                  </button>
                ) : null}
              </div>

              <span style={badgeStyle(p.status || "진행중")}>{p.status || "진행중"}</span>
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