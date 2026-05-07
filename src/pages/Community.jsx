import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { authFetch } from "../api/authFetch";
import { canOpenUserProfile, openUserProfile } from "../utils/profileNavigation";
import "./Community.css";

const TAB_LABELS = {
  question: "질문 게시판",
  review: "리뷰 게시판",
  free: "자유게시판",
};

const getInitialTab = (search) => {
  const tab = new URLSearchParams(search).get("tab");
  return tab === "review" || tab === "free" ? tab : "question";
};

const normalizePost = (item, type) => ({
  id: item.id,
  title: item.title || "제목 없음",
  excerpt: item.content || "",
  category: type === "QUESTION" ? "질문" : "자유",
  tag: type === "QUESTION" ? "" : String(item.regionTag || "").trim(),
  replies: item.commentCount ?? 0,
  views: item.viewCount ?? 0,
  time: item.createdAt ? String(item.createdAt).slice(0, 10) : "",
  userEmail: item.userEmail || null,
  authorNickname: item.authorNickname || "익명",
  isAnonymous: Boolean(item.isAnonymous),
});

const normalizeReview = (item) => ({
  id: item.id,
  title: item.title || "제목 없음",
  excerpt: item.content || "",
  place: item.targetTitle || "축제",
  time: item.createdAt || "",
  likes: item.likeCount ?? 0,
  comments: item.commentCount ?? 0,
  rating: item.rating ?? 0,
  authorEmail: item.authorEmail || null,
  authorNickname: item.authorNickname || "익명",
  isAnonymous: Boolean(item.isAnonymous),
});

export default function Community() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState(getInitialTab(location.search));
  const [keyword, setKeyword] = useState("");
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [freePosts, setFreePosts] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingFreePosts, setLoadingFreePosts] = useState(false);

  useEffect(() => {
    setTab(getInitialTab(location.search));
  }, [location.search]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const response = await axios.get("http://localhost:8080/api/posts?type=QUESTION");
        const list = Array.isArray(response.data) ? response.data : [];
        setQuestions(list.map((item) => normalizePost(item, "QUESTION")));
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
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setReviews(list.map(normalizeReview));
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
        setFreePosts(list.map((item) => normalizePost(item, "FREE")));
      } catch (error) {
        console.error("자유게시판 목록 로딩 실패:", error);
        setFreePosts([]);
      } finally {
        setLoadingFreePosts(false);
      }
    };

    fetchFreePosts();
  }, []);

  const filteredQuestions = useMemo(
    () => questions.filter((item) => item.title.toLowerCase().includes(keyword.toLowerCase())),
    [questions, keyword]
  );

  const filteredReviews = useMemo(
    () =>
      reviews.filter((item) =>
        `${item.title} ${item.excerpt} ${item.place}`.toLowerCase().includes(keyword.toLowerCase())
      ),
    [reviews, keyword]
  );

  const filteredFreePosts = useMemo(
    () =>
      freePosts.filter((item) =>
        `${item.title} ${item.excerpt} ${item.tag}`.toLowerCase().includes(keyword.toLowerCase())
      ),
    [freePosts, keyword]
  );

  const list = tab === "question" ? filteredQuestions : tab === "review" ? filteredReviews : filteredFreePosts;
  const loading = tab === "question" ? loadingQuestions : tab === "review" ? loadingReviews : loadingFreePosts;

  const openAuthor = (event, email, isAnonymous) => {
    event.preventDefault();
    if (canOpenUserProfile(email, isAnonymous)) {
      openUserProfile(navigate, email);
    }
  };

  const renderAuthor = (email, nickname, isAnonymous) => {
    const canOpen = canOpenUserProfile(email, isAnonymous);
    return (
      <span
        className="item-author"
        onClick={(event) => openAuthor(event, email, isAnonymous)}
        style={{ cursor: canOpen ? "pointer" : "default" }}
      >
        {isAnonymous ? "익명" : nickname || "익명"}
      </span>
    );
  };

  return (
    <div className="community-page">
      <header className="community-header">
        <h1 className="community-title">{TAB_LABELS[tab]}</h1>
        <p className="community-subtitle">
          {tab === "free"
            ? "축제 이야기와 후기를 자유롭게 나눠보세요."
            : tab === "review"
              ? "다른 사용자의 문화 취향과 방문 후기를 살펴보세요."
              : "축제, 지역, 교통, 경험에 대한 궁금한 것을 나눠보세요."}
        </p>
      </header>

      <div className="community-tabs">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <section className="community-search-row">
        <div className="community-search-box">
          <span className="search-icon">검색</span>
          <input
            className="community-search-input"
            placeholder="축제, 지역, 교통, 후기 키워드를 검색해보세요."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </section>

      <section className="community-list">
        {tab === "question" &&
          list.map((item) => (
            <Link key={item.id} to={`/community/question/${item.id}`} className="community-item-card">
              <div className="item-main">
                <h2 className="item-title">{item.title}</h2>
                <p className="item-excerpt">{item.excerpt}</p>
              </div>
              <div className="item-bottom">
                <div className="item-tags">
                  <span className="item-tag primary">{item.category}</span>
                  {item.tag ? <span className="item-tag subtle">{item.tag}</span> : null}
                </div>
                <div className="item-meta">
                  {renderAuthor(item.userEmail, item.authorNickname, item.isAnonymous)}
                  <span>댓글 {item.replies}</span>
                  <span>조회 {item.views}</span>
                  <span>{item.time}</span>
                </div>
              </div>
            </Link>
          ))}

        {tab === "review" &&
          list.map((item) => (
            <Link key={item.id} to={`/community/review/${item.id}`} className="community-item-card">
              <div className="item-main">
                <h2 className="item-title">{item.title}</h2>
                <p className="item-excerpt">{item.excerpt}</p>
              </div>
              <div className="item-bottom">
                <div className="item-tags">
                  <span className="item-tag primary">{item.place}</span>
                  <span className="item-tag subtle">리뷰</span>
                </div>
                <div className="item-meta">
                  {renderAuthor(item.authorEmail, item.authorNickname, item.isAnonymous)}
                  <span>별점 {item.rating}</span>
                  <span>공감 {item.likes}</span>
                  <span>댓글 {item.comments}</span>
                </div>
              </div>
            </Link>
          ))}

        {tab === "free" &&
          list.map((item) => (
            <Link key={item.id} to={`/community/free/${item.id}`} className="community-item-card">
              <div className="item-main">
                <h2 className="item-title">{item.title}</h2>
                <p className="item-excerpt">{item.excerpt}</p>
              </div>
              <div className="item-bottom">
                <div className="item-tags">
                  <span className="item-tag primary">자유</span>
                </div>
                <div className="item-meta">
                  {renderAuthor(item.userEmail, item.authorNickname, item.isAnonymous)}
                  <span>조회 {item.views}</span>
                  <span>{item.time}</span>
                </div>
              </div>
            </Link>
          ))}

        {loading && <div className="community-empty">목록을 불러오는 중입니다.</div>}

        {!loading && list.length === 0 && <div className="community-empty">등록된 게시글이 없습니다.</div>}
      </section>

      <div className="community-write-btn">
        <Link to={`/community/write/${tab}`}>
          {tab === "question" ? "질문 쓰기" : tab === "review" ? "리뷰 쓰기" : "자유글 쓰기"}
        </Link>
      </div>
    </div>
  );
}
