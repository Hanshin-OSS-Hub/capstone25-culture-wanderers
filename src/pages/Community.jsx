import React, { useState } from "react";
import "./Community.css";
import { Link } from "react-router-dom";

export default function Community() {
  const [tab, setTab] = useState("question"); // question | review
  const [keyword, setKeyword] = useState("");

  // 더미 데이터 (Figma 느낌 맞게 필드 조금 추가)
  const questions = [
    {
      id: 1,
      title: "홍대 거리 축제 드레스코드가 어떻게 되나요?",
      excerpt:
        "다음 주에 홍대 거리 축제에 처음 가는데, 특별한 드레스코드가 있는지 궁금합니다. 단톤 옷 입기라도 해야 할까요?",
      category: "패션·드레스코드",
      tag: "서울/홍대",
      time: "2시간 전",
      views: 86,
      replies: 8,
    },
    {
      id: 2,
      title: "부산 불꽃 축제 가는 교통편 추천 부탁드려요",
      excerpt:
        "서울에서 부산 불꽃 축제를 보러 가려고 하는데, KTX 말고 다른 교통편도 괜찮을까요? 비용을 줄이려면 어떤 방법이 좋을지 궁금합니다.",
      category: "교통·이동",
      tag: "부산",
      time: "5시간 전",
      views: 152,
      replies: 15,
    },
    {
      id: 3,
      title: "재즈 페스티벌 포션에 어떤 준비물이 필요할까요?",
      excerpt:
        "이번에 재즈 페스티벌에 처음 가봅니다. 야외 공연이라서 어떤 텐트나 돗자리를 챙겨가야 할지 고민이에요.",
      category: "준비물",
      tag: "서울",
      time: "1일 전",
      views: 129,
      replies: 12,
    },
  ];

  const reviews = [
    {
      id: 1,
      title: "서울 한밤 페스티벌 후기!",
      excerpt:
        "야경이 진짜 예쁘고 무대 구성이 생각보다 알찼어요. 입장 동선만 조금 더 정리되면 완벽할 듯...",
      place: "서울",
      time: "1일 전",
      likes: 23,
      comments: 4,
    },
    {
      id: 2,
      title: "락페스 생존팁 정리해봤어요",
      excerpt:
        "신발, 우비, 보조배터리, 텀블러까지... 처음 가는 분들이라면 이 정도는 꼭 챙겨가는 걸 추천합니다.",
      place: "인천",
      time: "3일 전",
      likes: 12,
      comments: 10,
    },
  ];

  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(keyword.toLowerCase())
  );

  const filteredReviews = reviews.filter((r) =>
    r.title.toLowerCase().includes(keyword.toLowerCase())
  );

  const list = tab === "question" ? filteredQuestions : filteredReviews;

  return (
    <div className="community-page">
      {/* 상단 헤더 */}
      <header className="community-header">
        <h1 className="community-title">
          {tab === "question" ? "질문 게시판" : "리뷰 게시판"}
        </h1>
        <p className="community-subtitle">
          축제, 지역, 교통, 트렌드스코어 등 궁금한 것을 물어보세요
        </p>
      </header>

      {/* 탭 */}
      <div className="community-tabs">
        <button
          className={tab === "question" ? "active" : ""}
          onClick={() => setTab("question")}
        >
          질문 게시판
        </button>
        <button
          className={tab === "review" ? "active" : ""}
          onClick={() => setTab("review")}
        >
          리뷰 게시판
        </button>
      </div>

      {/* 검색 + 필터 영역 */}
      <section className="community-search-row">
        <div className="community-search-box">
          <span className="search-icon">🔍</span>
          <input
            className="community-search-input"
            placeholder="축제, 지역, 교통, 드레스코드 등 궁금한 것을 검색해보세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="community-filter-row">
          <select className="community-filter-select">
            <option>전체 지역</option>
            <option>서울</option>
            <option>부산</option>
            <option>인천</option>
          </select>
          <select className="community-filter-select">
            <option>전체 정렬</option>
            <option>최신순</option>
            <option>조회수 높은순</option>
            <option>답변 많은순</option>
          </select>
        </div>
      </section>

      {/* 리스트 */}
      <section className="community-list">
        {tab === "question" &&
          list.map((q) => (
            <Link
              key={q.id}
              to={`/community/question/${q.id}`}
              className="community-item-card"
            >
              <div className="item-main">
                <h2 className="item-title">{q.title}</h2>
                <p className="item-excerpt">{q.excerpt}</p>
              </div>

              <div className="item-bottom">
                <div className="item-tags">
                  <span className="item-tag primary">{q.category}</span>
                  <span className="item-tag subtle">{q.tag}</span>
                </div>
                <div className="item-meta">
                  <span>💬 {q.replies}</span>
                  <span>👁 {q.views}</span>
                  <span>{q.time}</span>
                </div>
              </div>
            </Link>
          ))}

        {tab === "review" &&
          list.map((r) => (
            <Link
              key={r.id}
              to={`/community/review/${r.id}`}
              className="community-item-card"
            >
              <div className="item-main">
                <h2 className="item-title">{r.title}</h2>
                <p className="item-excerpt">{r.excerpt}</p>
              </div>

              <div className="item-bottom">
                <div className="item-tags">
                  <span className="item-tag primary">{r.place}</span>
                  <span className="item-tag subtle">리뷰</span>
                </div>
                <div className="item-meta">
                  <span>❤️ {r.likes}</span>
                  <span>💬 {r.comments}</span>
                  <span>{r.time}</span>
                </div>
              </div>
            </Link>
          ))}

        {list.length === 0 && (
          <div className="community-empty">검색 결과가 없습니다.</div>
        )}
      </section>

      {/* 글쓰기 버튼 */}
      <div className="community-write-btn">
        <Link to={`/community/write/${tab}`}>
          {tab === "question" ? "질문 쓰기" : "리뷰 쓰기"}
        </Link>
      </div>
    </div>
  );
}
