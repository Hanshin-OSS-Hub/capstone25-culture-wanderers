import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) return;
    navigate(`/result?q=${encodeURIComponent(keyword)}`);
    setQ("");
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          문화유목민
        </Link>

        <form className="header-search" onSubmit={onSubmit}>
          <input
            className="header-search-input"
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
          <Link to="/mypage">마이페이지</Link>
        </nav>
      </div>
    </header>
  );
}