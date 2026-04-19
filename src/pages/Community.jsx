import React, { useEffect, useMemo, useState } from "react";
import "./Community.css";
import { Link, useLocation } from "react-router-dom";
import { authFetch } from "../api/authFetch";

export default function Community() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") === "review" ? "review" : "question";

  const [tab, setTab] = useState(initialTab);
  const [keyword, setKeyword] = useState("");
  const [questions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const nextTab = params.get("tab") === "review" ? "review" : "question";
    setTab(nextTab);
  }, [location.search]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);

        const data = await authFetch("/api/me/reviews");
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const normalized = list.map((item) => ({
          id: item.id,
          title: item.title || "제목 없음",
          excerpt: item.content || "",
          place: item.targetTitle || "축제",
          time: item.createdAt || "",
          likes: item.likeCount ?? 0,
          comments: item.commentCount ?? 0,
          rating: item.rating ?? 0,
        }));

        setReviews(normalized);
      } catch (error) {
        console.error("리뷰 목록 로딩 실패:", error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) =>
      q.title.toLowerCase().includes(keyword.toLowerCase())
    );
  }, [questions, keyword]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) =>
      `${r.title} ${r.excerpt} ${r.place}`
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );
  }, [reviews, keyword]);

  const list = tab === "question" ? filteredQuestions : filteredReviews;

  return (
    <div className="community-page">
      <header className="community-header">
        <h1 className="community-title">
          {tab === "question" ? "질문 게시판" : "리뷰 게시판"}
        </h1>
        <p className="community-subtitle">
          축제, 지역, 교통, 트렌드스코어 등 궁금한 것을 물어보세요
        </p>
      </header>

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
                  <span>★ {r.rating}</span>
                  <span>❤️ {r.likes}</span>
                  <span>💬 {r.comments}</span>
                </div>
              </div>
            </Link>
          ))}

        {tab === "review" && loadingReviews && (
          <div className="community-empty">리뷰를 불러오는 중입니다.</div>
        )}

        {((tab === "question" && list.length === 0) ||
          (tab === "review" && !loadingReviews && list.length === 0)) && (
          <div className="community-empty">
            {tab === "question"
              ? "등록된 질문이 없습니다."
              : "등록된 리뷰가 없습니다."}
          </div>
        )}
      </section>

      <div className="community-write-btn">
        <Link to={`/community/write/${tab}`}>
          {tab === "question" ? "질문 쓰기" : "리뷰 쓰기"}
        </Link>
      </div>
    </div>
  );
}