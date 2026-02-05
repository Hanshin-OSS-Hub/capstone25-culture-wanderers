import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { search } = useLocation();

  // 다른 페이지에서 ?q= 가 있으면 헤더 검색창에도 반영
  useEffect(() => {
    const params = new URLSearchParams(search);
    const nextQ = params.get("q") || "";
    setQ(nextQ);
  }, [search]);

  const onSubmit = (e) => {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) return;
    navigate(`/result?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* 로고 */}
        <Link to="/" className="header-logo">
          문화유목민
        </Link>

        {/* 검색 */}
        <form className="header-search" onSubmit={onSubmit}>
          <input
            className="header-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색"
          />
        </form>

        {/* 메뉴 */}
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
