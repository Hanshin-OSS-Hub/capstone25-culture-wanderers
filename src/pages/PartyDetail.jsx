// src/pages/PartyDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../api/authFetch";
import "./Party.css";

export default function PartyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartyDetail = async () => {
      try {
        const data = await authFetch("/api/me/party-posts");

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const normalizedList = list.map((item) => {
          const currentCount = item.currentPeople ?? item.currentMembers ?? 0;
          const maxCount = item.maxPeople ?? item.maxMembers ?? 2;

          return {
            id: String(item.id),
            dday: item.dday || "",
            status: currentCount >= maxCount ? "신청 완료" : "신청 가능",
            title: item.title || "제목 없음",
            festival: item.festivalTitle || "축제 정보 없음",
            date: item.eventDate || item.date || "일정 미정",
            location:
              [item.region, item.location].filter(Boolean).join(" ") ||
              item.festivalTitle ||
              "장소 미정",
            currentCount,
            maxCount,
            hostName: item.authorNickname || item.nickname || "작성자",
            hostLevel: item.authorLevel || "",
            detail: item.content || "상세 내용이 없습니다.",
            condition: item.condition || "별도의 모집 조건이 없습니다.",
            contact: item.contact || "연락 방법 정보가 없습니다.",
            deadline: item.deadline || "마감 정보가 없습니다.",
            festivalId: item.festivalId,
          };
        });

        const foundParty =
          normalizedList.find((p) => String(p.id) === String(id)) || null;

        setParty(foundParty);
      } catch (error) {
        console.error("파티 상세 로딩 실패:", error);
        setParty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPartyDetail();
  }, [id]);

  const progress = useMemo(() => {
    if (!party || !party.maxCount) return 0;
    return (party.currentCount / party.maxCount) * 100;
  }, [party]);

  if (loading) {
    return <div className="loading-box">파티 정보를 불러오는 중...</div>;
  }

  if (!party) {
    return (
      <div className="party-detail-page">
        <button className="party-back-btn" onClick={() => navigate(-1)}>
          ← 파티 목록으로
        </button>

        <div className="party-detail-card">
          <div className="party-detail-body">
            <section className="party-detail-section">
              <h2>파티 정보를 찾을 수 없습니다.</h2>
              <p>
                삭제되었거나 현재 로그인한 사용자의 파티 모집글이 아닐 수 있습니다.
              </p>
            </section>

            <div className="party-detail-actions">
              <button
                className="party-detail-apply-btn"
                onClick={() => navigate("/party")}
              >
                파티 목록으로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="party-detail-page">
      {/* 상단 뒤로가기 */}
      <button className="party-back-btn" onClick={() => navigate(-1)}>
        ← 파티 목록으로
      </button>

      {/* 관련 축제 요약 카드 */}
      <section className="party-festival-section">
        <div className="party-festival-card">
          <div className="party-festival-tag">관련 축제</div>
          <h2 className="party-festival-title">{party.festival}</h2>
          <p className="party-festival-meta">
            {party.date} · {party.location}
          </p>
          <button
            className="party-festival-link-btn"
            onClick={() => {
              if (party.festivalId) {
                navigate(`/detail/${party.festivalId}`);
              } else {
                navigate("/search");
              }
            }}
          >
            축제 정보 더 보러가기 →
          </button>
        </div>
      </section>

      {/* 파티 모집 상세 카드 */}
      <div className="party-detail-card">
        {/* 상단 배지/제목 영역 */}
        <div className="party-detail-header">
          <div className="party-badges-row">
            {party.dday && <span className="badge-dday">{party.dday}</span>}
            <span className="badge-status">{party.status}</span>
          </div>

          <h1 className="party-detail-title">{party.title}</h1>

          <div className="party-detail-meta">
            <div>
              <span className="meta-label">축제</span>
              <span>{party.festival}</span>
            </div>
            <div>
              <span className="meta-label">일시</span>
              <span>{party.date}</span>
            </div>
            <div>
              <span className="meta-label">장소</span>
              <span>{party.location}</span>
            </div>
          </div>
        </div>

        {/* 본문 영역 */}
        <div className="party-detail-body">
          <section className="party-detail-section">
            <h2>모집 현황</h2>
            <div className="party-progress-header">
              <span className="party-progress-label">현재 인원</span>
              <span className="party-count-text">
                {party.currentCount}/{party.maxCount}명
              </span>
            </div>

            <div className="party-progress-bar">
              <div
                className="party-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="party-detail-section">
            <h2>행사 소개 / 함께 할 내용</h2>
            <p>{party.detail}</p>
          </section>

          <section className="party-detail-section">
            <h2>모집 조건</h2>
            <p>{party.condition}</p>
          </section>

          <section className="party-detail-section">
            <h2>연락 방법</h2>
            <p>{party.contact}</p>
          </section>

          <section className="party-detail-section">
            <h2>마감 안내</h2>
            <p>{party.deadline}</p>
          </section>

          <section className="party-detail-section">
            <h2>파티장 정보</h2>
            <div className="party-host">
              <div className="party-host-avatar">🎉</div>
              <div className="party-host-name">{party.hostName}</div>
              {party.hostLevel && (
                <span className="party-host-level">{party.hostLevel}</span>
              )}
            </div>
          </section>

          <div className="party-detail-actions">
            <button className="party-detail-apply-btn">참여 신청하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}