// src/pages/PartyList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authFetch } from "../api/authFetch";
import "./Party.css";

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
        const data = await authFetch("/api/me/party-posts");

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const normalized = list.map((item) => {
          const currentCount = item.currentPeople ?? item.currentMembers ?? 0;
          const maxCount = item.maxPeople ?? item.maxMembers ?? 2;
          const region = item.region || "";
          const locationText = item.location || item.festivalTitle || "장소 미정";

          return {
            id: item.id,
            dday: item.dday || "",
            status:
              currentCount >= maxCount
                ? "신청 완료"
                : "신청 가능",
            title: item.title || "제목 없음",
            festival: item.festivalTitle || "축제 정보 없음",
            date: item.eventDate || item.date || "일정 미정",
            location: [region, locationText].filter(Boolean).join(" "),
            currentCount,
            maxCount,
            hostName: item.authorNickname || item.nickname || "작성자",
            hostLevel: item.authorLevel || "",
            createdAt: item.createdAt || "",
            region,
          };
        });

        setParties(normalized);
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
      next = next.filter((party) => {
        const regionText = `${party.region} ${party.location}`.toLowerCase();
        return regionText.includes(regionFilter.toLowerCase());
      });
    }

    if (sortType === "마감 임박순") {
      next.sort((a, b) => {
        const getDdayNum = (value) => {
          if (!value || !String(value).startsWith("D-")) return 9999;
          return Number(String(value).replace("D-", "")) || 9999;
        };
        return getDdayNum(a.dday) - getDdayNum(b.dday);
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

      <div className="party-filter-bar">
        <div className="party-filter-group">
          <span className="party-filter-label">지역</span>
          <select
            className="party-filter-select"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option>전체</option>
            <option>서울</option>
            <option>부산</option>
            <option>인천</option>
            <option>경기</option>
            <option>전라남도</option>
            <option>전라북도</option>
            <option>충청남도</option>
            <option>경상북도</option>
          </select>
        </div>

        <div className="party-filter-group">
          <span className="party-filter-label">날짜</span>
          <div className="party-filter-chips">
            <button type="button" className="chip chip-active">오늘</button>
            <button type="button" className="chip">이번주</button>
            <button type="button" className="chip">직접 선택</button>
          </div>
        </div>

        <div className="party-filter-group party-filter-group-right">
          <span className="party-filter-label">정렬</span>
          <select
            className="party-filter-select"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option>최신순</option>
            <option>마감 임박순</option>
          </select>
        </div>
      </div>

      <div className="party-count">
        총 {filteredParties.length}개의 모집글이 있습니다.
      </div>

      <div className="party-list">
        {loading ? (
          <div className="community-empty">파티 목록을 불러오는 중입니다.</div>
        ) : filteredParties.length === 0 ? (
          <div className="community-empty">등록된 파티 모집글이 없습니다.</div>
        ) : (
          filteredParties.map((party) => {
            const progress =
              party.maxCount > 0
                ? (party.currentCount / party.maxCount) * 100
                : 0;

            return (
              <Link
                key={party.id}
                to={`/party/${party.id}`}
                className="party-card"
              >
                <div className="party-card-inner">
                  <div className="party-card-left">
                    <div className="party-badges-row">
                      {party.dday && <span className="badge-dday">{party.dday}</span>}
                      <span className="badge-status">{party.status}</span>
                    </div>

                    <div className="party-card-title">
                      {party.title} ({party.currentCount}/{party.maxCount}명)
                    </div>

                    <div className="party-meta">
                      <span>🎪 {party.festival}</span>
                      <span>🕒 {party.date}</span>
                      <span>📍 {party.location}</span>
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
                          className="party-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="party-host-row">
                      <div className="party-host">
                        <div className="party-host-avatar">🎉</div>
                        <div className="party-host-name">{party.hostName}</div>
                        {party.hostLevel && (
                          <span className="party-host-level">{party.hostLevel}</span>
                        )}
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
          })
        )}
      </div>
    </div>
  );
}