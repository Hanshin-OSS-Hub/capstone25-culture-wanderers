import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AiChatWidget from "./AiChatWidget";

export default function Layout({ children }) {
  const STORAGE_KEY = "loggedInUser";
  const navigate = useNavigate();

  const getLoggedInUser = () =>
    localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);

  const user = getLoggedInUser();

  const [q, setQ] = useState("");

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) return;

    navigate(`/result?q=${encodeURIComponent(keyword)}`);
    setQ("");
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">
          <Link to="/">문화유목민</Link>
        </div>

        <form className="header-search" onSubmit={onSubmitSearch}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색"
          />
        </form>

        <nav className="header-nav">
          <Link to="/search">축제 탐색</Link>
          <Link to="/party">파티 모집</Link>
          <Link to="/community">커뮤니티</Link>
          <Link to="/benefits">학생 할인 모아보기</Link>

          {user ? (
            <Link to="/mypage">마이페이지</Link>
          ) : (
            <Link to="/login">로그인</Link>
          )}
        </nav>
      </header>

      <main className="app-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>문화유목민</h4>
            <p>학생을 위한 지역 문화 탐색 및 파티 모집 플랫폼</p>
          </div>

          <div className="footer-col">
            <h5>서비스</h5>
            <ul>
              <li>축제 탐색</li>
              <li>학생 할인 모아보기</li>
              <li>파티 모집</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>커뮤니티</h5>
            <ul>
              <li>질문 게시판</li>
              <li>리뷰 게시판</li>
              <li>공지사항</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>고객지원</h5>
            <ul>
              <li>FAQ</li>
              <li>문의하기</li>
              <li>이용약관</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © 2025 문화유목민. All rights reserved.
        </div>
      </footer>

      <AiChatWidget />
    </div>
  );
}