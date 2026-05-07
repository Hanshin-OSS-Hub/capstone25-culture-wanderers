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
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
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
        <div style={emptyStyle}>참여한 파티가 없습니다.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {parties.map((party) => {
            const status = String(party.status || "진행중").toUpperCase();
            const isCompleted = status === "COMPLETED" || party.status === "파티 완료";

            return (
              <div
                key={party.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/party/${party.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/party/${party.id}`);
                  }
                }}
                style={cardStyle}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{party.title || "파티"}</div>
                  <div style={dateStyle}>
                    {party.meetingTime
                      ? String(party.meetingTime).replace("T", " ").slice(0, 16)
                      : "일정 없음"}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {party.festivalId ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/detail/${party.festivalId}`);
                        }}
                        style={linkButtonStyle}
                      >
                        축제 상세 보기
                      </button>
                    ) : null}

                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/party/${party.id}`);
                        }}
                        style={ratingButtonStyle}
                      >
                        동행 평가하기
                      </button>
                    ) : null}
                  </div>
                </div>

                <span style={badgeStyle(isCompleted)}>{isCompleted ? "파티 완료" : "진행중"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const emptyStyle = {
  padding: 20,
  textAlign: "center",
  color: "#6b7280",
  border: "1px solid #f1e4ee",
  borderRadius: 12,
  background: "#fff",
};

const cardStyle = {
  border: "1px solid #f1e4ee",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "#fff",
  cursor: "pointer",
};

const dateStyle = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 2,
  marginBottom: 8,
};

const linkButtonStyle = {
  border: "1px solid #ffd3e3",
  background: "#fff9fc",
  color: "#ff538b",
  borderRadius: 8,
  padding: "4px 8px",
  fontSize: 12,
  cursor: "pointer",
};

const ratingButtonStyle = {
  border: "1px solid #d8c7ff",
  background: "#f9f5ff",
  color: "#6b46c1",
  borderRadius: 8,
  padding: "4px 8px",
  fontSize: 12,
  cursor: "pointer",
};

function badgeStyle(isCompleted) {
  return {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #f1e4ee",
    background: isCompleted ? "#ecfdf3" : "#fff3f8",
    color: isCompleted ? "#11875d" : "#ff538b",
    whiteSpace: "nowrap",
  };
}
