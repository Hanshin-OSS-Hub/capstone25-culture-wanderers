import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { authFetch } from "../api/authFetch";
import "./Party.css";

const REGION_OPTIONS = [
  "전체",
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

function formatDateTime(value) {
  if (!value) return "일정 미정";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function normalizeParty(item) {
  const currentCount = item.currentPeople ?? item.currentMembers ?? 0;
  const maxCount = item.maxPeople ?? item.maxMembers ?? 2;
  const rawStatus = String(item.status || "RECRUITING").toUpperCase();
  const isClosed = rawStatus === "CLOSED";

  return {
    id: item.id,
    status: isClosed ? "모집 마감" : "모집 중",
    isClosed,
    title: item.title || "제목 없음",
    festival: item.festivalTitle || "축제 정보 없음",
    date: formatDateTime(item.meetingTime),
    location: item.location || "장소 미정",
    currentCount,
    maxCount,
    hostName: item.authorNickname || "작성자",
    createdAt: item.createdAt || "",
    region: item.location || "",
    deadline: item.deadline || null,
  };
}

export default function PartyList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [parties, setParties] = useState([]);
  const [regionFilter, setRegionFilter] = useState("전체");
  const [sortType, setSortType] = useState("최신순");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const data = await authFetch("/api/party-posts");
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setParties(list.map(normalizeParty));
      } catch (error) {
        console.error("파티 목록 로딩 실패:", error);
        setParties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [location.key]);

  const filteredParties = useMemo(() => {
    let next = [...parties];

    if (regionFilter !== "전체") {
      next = next.filter((party) => String(party.location || "").includes(regionFilter));
    }

    if (sortType === "마감임박순") {
      next.sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    } else {
      next.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    }

    return next;
  }, [parties, regionFilter, sortType]);

  return (
    <div className="party-page">
      <div className="party-header-row">
        <div>
          <div className="party-title">파티 모집</div>
          <div className="party-sub">함께 갈 사람을 찾아보세요.</div>
        </div>

        <button className="party-write-btn" onClick={() => navigate("/party/write")}>
          파티원 모집 글 쓰기
        </button>
      </div>

      <div className="party-filter-bar">
        <div className="party-filter-group">
          <span className="party-filter-label">지역</span>
          <select className="party-filter-select" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            {REGION_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="party-filter-group">
          <span className="party-filter-label">상태</span>
          <div className="party-filter-chips">
            <button type="button" className="chip chip-active">
              전체
            </button>
            <button type="button" className="chip">
              모집 중
            </button>
            <button type="button" className="chip">
              마감
            </button>
          </div>
        </div>

        <div className="party-filter-group party-filter-group-right">
          <span className="party-filter-label">정렬</span>
          <select className="party-filter-select" value={sortType} onChange={(e) => setSortType(e.target.value)}>
            <option>최신순</option>
            <option>마감임박순</option>
          </select>
        </div>
      </div>

      <div className="party-count">총 {filteredParties.length}개의 모집글이 있어요.</div>

      <div className="party-list">
        {loading ? (
          <div className="community-empty">파티 목록을 불러오는 중입니다.</div>
        ) : filteredParties.length === 0 ? (
          <div className="community-empty">등록된 파티 모집글이 없어요.</div>
        ) : (
          filteredParties.map((party) => {
            const progress = party.maxCount > 0 ? (party.currentCount / party.maxCount) * 100 : 0;

            return (
              <Link key={party.id} to={`/party/${party.id}`} className="party-card">
                <div className="party-card-inner">
                  <div className="party-card-left">
                    <div className="party-badges-row">
                      <span className={`badge-status ${party.isClosed ? "closed" : ""}`}>{party.status}</span>
                    </div>

                    <div className="party-card-title">
                      {party.title} ({party.currentCount}/{party.maxCount}명)
                    </div>

                    <div className="party-meta">
                      <span>[축제] {party.festival}</span>
                      <span>[일정] {party.date}</span>
                      <span>[장소] {party.location}</span>
                    </div>

                    <div className="party-progress-block">
                      <div className="party-progress-header">
                        <span className="party-progress-label">모집 현황</span>
                        <span className="party-count-text">
                          {party.currentCount}/{party.maxCount}명
                        </span>
                      </div>

                      <div className="party-progress-bar">
                        <div
                          className={`party-progress-fill ${party.isClosed ? "closed" : ""}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="party-host-row">
                      <div className="party-host">
                        <div className="party-host-name">{party.hostName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
