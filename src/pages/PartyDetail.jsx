import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Party.css";

// 리스트/상세 둘 다에서 쓸 가짜 데이터
const MOCK_PARTIES = [
  {
    id: "1",
    dday: "D-6",
    status: "신청 가능",
    title: "홍대 페스티벌 같이 가실 분 (2/4명)",
    festival: "2025 홍대 거리공연 축제",
    date: "2025-12-01 18:00",
    location: "서울 마포구",
    currentCount: 2,
    maxCount: 4,
    hostName: "페스티벌러버",
    hostLevel: "Lv.12",
    detail:
      "홍대 거리공연 축제 보러 같이 가실 분 구해요! 공연 위주로 둘러보고, 끝나고 근처 카페에서 간단히 이야기 하는 정도로 생각하고 있어요.",
    condition:
      "20대 대학생/취준생이면 누구나 환영합니다. 혼자 와도 전혀 어색하지 않게 먼저 말 걸어드릴게요 :)",
    contact:
      "카카오톡 오픈채팅 링크를 DM으로 드릴게요. 댓글로 참여 의사만 남겨주세요!",
    deadline: "행사 전날(11/30) 밤 11시까지 신청 받습니다.",
  },
  {
    id: "2",
    dday: "D-2",
    status: "신청 완료",
    title: "부산 불꽃축제 함께 보러 가요 (3/4명)",
    festival: "부산 불꽃축제",
    date: "2025-11-27 19:30",
    location: "부산 해운대구",
    currentCount: 3,
    maxCount: 4,
    hostName: "불꽃사랑",
    hostLevel: "Lv.8",
    detail:
      "해운대 쪽에서 다 같이 모여서 자리 잡고 불꽃축제 관람하려고 합니다. 간단한 간식은 제가 조금 챙겨갈게요!",
    condition:
      "부산/경남 거주자면 좋고, 처음 보는 사람과도 대화 나누는 거 부담 없는 분이면 좋겠습니다.",
    contact: "카톡 아이디는 댓글 남겨주시면 1:1로 드릴게요.",
    deadline: "인원 마감 시 조기 마감될 수 있어요.",
  },
];

export default function PartyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const party = MOCK_PARTIES.find((p) => p.id === id) ?? MOCK_PARTIES[0];
  const progress = (party.currentCount / party.maxCount) * 100;

  return (
    <div className="party-detail-page">
      {/* 상단 뒤로가기 */}
      <button className="party-back-btn" onClick={() => navigate(-1)}>
        ← 파티 목록으로
      </button>

      {/* 🔹 관련 축제 요약 카드 */}
      <section className="party-festival-section">
        <div className="party-festival-card">
          <div className="party-festival-tag">관련 축제</div>
          <h2 className="party-festival-title">{party.festival}</h2>
          <p className="party-festival-meta">
            {party.date} · {party.location}
          </p>
          <button
            className="party-festival-link-btn"
            onClick={() => navigate("/search")}
          >
            축제 정보 더 보러가기 →
          </button>
        </div>
      </section>

      {/* 🔹 파티 모집 상세 카드 */}
      <div className="party-detail-card">
        {/* 상단 배지/제목 영역 */}
        <div className="party-detail-header">
          <div className="party-badges-row">
            <span className="badge-dday">{party.dday}</span>
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
              <span className="party-host-level">{party.hostLevel}</span>
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
