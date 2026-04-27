import React, { useEffect, useMemo, useState } from "react";
import "./Community.css";
import { Link, useLocation } from "react-router-dom";
import { authFetch } from "../api/authFetch";
import axios from "axios";

export default function Community() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tabParam = params.get("tab");
  const initialTab =
    tabParam === "review" || tabParam === "free" ? tabParam : "question";

  const [tab, setTab] = useState(initialTab);
  const [keyword, setKeyword] = useState("");
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [freePosts, setFreePosts] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingFreePosts, setLoadingFreePosts] = useState(false);

  useEffect(() => {
    const nextTabParam = params.get("tab");
    const nextTab =
      nextTabParam === "review" || nextTabParam === "free"
        ? nextTabParam
        : "question";
    setTab(nextTab);
  }, [location.search]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);

        const response = await axios.get("http://localhost:8080/api/posts?type=QUESTION");
        const list = Array.isArray(response.data) ? response.data : [];

        const normalized = list.map((item) => ({
          id: item.id,
          title: item.title || "제목 없음",
          excerpt: item.content || "",
          category: "질문",
          tag: item.regionTag || "일반",
          replies: item.commentCount ?? 0,
          views: item.viewCount ?? 0,
          time: item.createdAt ? String(item.createdAt).slice(0, 10) : "",
        }));

        setQuestions(normalized);
      } catch (error) {
        console.error("질문 목록 로딩 실패:", error);
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);

        const data = await authFetch("/api/reviews");
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

  useEffect(() => {
    const fetchFreePosts = async () => {
      try {
        setLoadingFreePosts(true);

        const response = await axios.get("http://localhost:8080/api/posts?type=FREE");
        const list = Array.isArray(response.data) ? response.data : [];

        const normalized = list.map((item) => ({
          id: item.id,
          title: item.title || "제목 없음",
          excerpt: item.content || "",
          category: "자유",
          tag: item.regionTag || "일반",
          views: item.viewCount ?? 0,
          time: item.createdAt ? String(item.createdAt).slice(0, 10) : "",
        }));

        setFreePosts(normalized);
      } catch (error) {
        console.error("자유게시판 목록 로딩 실패:", error);
        setFreePosts([]);
      } finally {
        setLoadingFreePosts(false);
      }
    };

    fetchFreePosts();
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

  const filteredFreePosts = useMemo(() => {
    return freePosts.filter((p) =>
      `${p.title} ${p.excerpt} ${p.tag}`.toLowerCase().includes(keyword.toLowerCase())
    );
  }, [freePosts, keyword]);

  const list =
    tab === "question"
      ? filteredQuestions
      : tab === "review"
      ? filteredReviews
      : filteredFreePosts;

  return (
    <div className="community-page">
      <header className="community-header">
        <h1 className="community-title">
          {tab === "question"
            ? "질문 게시판"
            : tab === "review"
            ? "리뷰 게시판"
            : "자유게시판"}
        </h1>
        <p className="community-subtitle">
          {tab === "free"
            ? "축제 이야기, 팁, 후기 등을 자유롭게 나눠보세요"
            : "축제, 지역, 교통, 트렌드스코어 등 궁금한 것을 물어보세요"}
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
        <button
          className={tab === "free" ? "active" : ""}
          onClick={() => setTab("free")}
        >
          자유게시판
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

        {tab === "free" &&
          list.map((p) => (
            <Link
              key={p.id}
              to={`/community/free/${p.id}`}
              className="community-item-card"
            >
              <div className="item-main">
                <h2 className="item-title">{p.title}</h2>
                <p className="item-excerpt">{p.excerpt}</p>
              </div>

              <div className="item-bottom">
                <div className="item-tags">
                  <span className="item-tag primary">자유</span>
                  <span className="item-tag subtle">{p.tag}</span>
                </div>
                <div className="item-meta">
                  <span>👁 {p.views}</span>
                  <span>{p.time}</span>
                </div>
              </div>
            </Link>
          ))}

        {tab === "review" && loadingReviews && (
          <div className="community-empty">리뷰를 불러오는 중입니다.</div>
        )}

        {tab === "question" && loadingQuestions && (
          <div className="community-empty">질문을 불러오는 중입니다.</div>
        )}

        {tab === "free" && loadingFreePosts && (
          <div className="community-empty">자유게시글을 불러오는 중입니다.</div>
        )}

        {((tab === "question" && !loadingQuestions && list.length === 0) ||
          (tab === "review" && !loadingReviews && list.length === 0) ||
          (tab === "free" && !loadingFreePosts && list.length === 0)) && (
          <div className="community-empty">
            {tab === "question"
              ? "등록된 질문이 없습니다."
              : tab === "review"
              ? "등록된 리뷰가 없습니다."
              : "등록된 자유게시글이 없습니다."}
          </div>
        )}
      </section>

      <div className="community-write-btn">
        <Link to={`/community/write/${tab}`}>
          {tab === "question"
            ? "질문 쓰기"
            : tab === "review"
            ? "리뷰 쓰기"
            : "자유글 쓰기"}
        </Link>
      </div>
    </div>
  );
}