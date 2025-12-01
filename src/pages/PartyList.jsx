// src/pages/PartyList.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Party.css";

export default function PartyList() {
  const navigate = useNavigate();

  const parties = [
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
    },
  ];

  return (
    <div className="party-page">
      {/* 상단 제목 + 버튼 */}
      <div className="party-header-row">
        <div>
          <div className="party-title">파티원 모집</div>
          <div className="party-sub">함께 갈 파티원을 찾아보세요.</div>
        </div>

        <button
          className="party-write-btn"
          onClick={() => navigate("/party/write")}
        >
          파티원 모집 글 쓰기
        </button>
      </div>

      {/* 필터 영역 (지금은 UI만) */}
      <div className="party-filter-bar">
        <div className="party-filter-group">
          <span className="party-filter-label">지역</span>
          <select className="party-filter-select">
            <option>전체</option>
            <option>서울</option>
            <option>부산</option>
          </select>
        </div>

        <div className="party-filter-group">
          <span className="party-filter-label">날짜</span>
          <div className="party-filter-chips">
            <button className="chip chip-active">오늘</button>
            <button className="chip">이번주</button>
            <button className="chip">직접 선택</button>
          </div>
        </div>

        <div className="party-filter-group party-filter-group-right">
          <span className="party-filter-label">정렬</span>
          <select className="party-filter-select">
            <option>최신순</option>
            <option>마감 임박순</option>
          </select>
        </div>
      </div>

      <div className="party-count">총 {parties.length}개의 모집글이 있습니다.</div>

      {/* 카드 리스트 */}
      <div className="party-list">
        {parties.map((party) => {
          const progress =
            (party.currentCount / party.maxCount) * 100;

          return (
            <Link
              key={party.id}
              to={`/party/${party.id}`}
              className="party-card"
            >
              <div className="party-card-inner">
                <div className="party-card-left">
                  <div className="party-badges-row">
                    <span className="badge-dday">{party.dday}</span>
                    <span className="badge-status">{party.status}</span>
                  </div>

                  <div className="party-card-title">{party.title}</div>

                  <div className="party-meta">
                    <span>🎪 {party.festival}</span>
                    <span>🕒 {party.date}</span>
                    <span>📍 {party.location}</span>
                  </div>

                  <div className="party-progress-block">
                    <div className="party-progress-header">
                      <span className="party-progress-label">
                        모집 현황
                      </span>
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
                  </div>

                  <div className="party-host-row">
                    <div className="party-host">
                      <div className="party-host-avatar">🎉</div>
                      <div className="party-host-name">
                        {party.hostName}
                      </div>
                      <span className="party-host-level">
                        {party.hostLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="party-card-right">
                  <div className="party-count-text">
                    {party.currentCount}/{party.maxCount}명
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
