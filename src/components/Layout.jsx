import { Link } from "react-router-dom";

export default function Layout({ children }) {
  const STORAGE_KEY = "loggedInUser";

  // 현재 로그인된 사용자 체크 (localStorage 또는 sessionStorage)
  const getLoggedInUser = () =>
    localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);

  const user = getLoggedInUser();

  return (
    <div className="app-root">
      {/* 헤더 */}
      <header className="app-header">
        <div className="logo">
          <Link to="/">문화유목민</Link>
        </div>

        <div className="header-search">
          <input placeholder="검색" />
        </div>

        <nav className="header-nav">
          <Link to="/search">축제 탐색</Link>
          <Link to="/party">파티 모집</Link>
          <Link to="/community">커뮤니티</Link>
          <Link to="/benefits">학생 할인 모아보기</Link>

          {/* 🔽 로그인 여부에 따라 메뉴가 달라짐 */}
          {user ? (
            <Link to="/mypage">마이페이지</Link>
          ) : (
            <Link to="/login">로그인</Link>
          )}
        </nav>
      </header>

      {/* 페이지 내용 */}
      <main className="app-main">{children}</main>

      {/* 푸터 */}
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
    </div>
  );
}
