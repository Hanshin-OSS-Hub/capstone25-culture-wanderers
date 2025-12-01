// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import "./Login.css";

const STORAGE_KEY = "loggedInUser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored =
      localStorage.getItem(STORAGE_KEY) ||
      sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      window.location.href = "/mypage";
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    // 임시 계정
    const dummyEmail = "test@nomad.com";
    const dummyPassword = "1234";

    if (email === dummyEmail && password === dummyPassword) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);

      const storage = keepLogin ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEY, email);

      window.location.href = "/mypage";
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || !email || !password;

  return (
    <main className="page login-page">
      <div className="login-wrapper">
        {/* 상단 브랜드 영역 */}
        <div className="login-brand">
          <div className="login-logo-mark">🍑</div>
          <div className="login-logo-title">문화유목민</div>
          <p className="login-logo-sub">"대학생 문화생활 플랫폼"</p>
        </div>

        {/* 로그인 카드 */}
        <section className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
            {/* 이메일 */}
            <div className="login-field">
              <label className="login-label">이메일</label>
              <input
                type="email"
                className="login-input"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* 비밀번호 */}
            <div className="login-field">
              <label className="login-label">비밀번호</label>
              <input
                type="password"
                className="login-input"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* 에러 메시지 */}
            {error && <div className="login-error">{error}</div>}

            {/* 옵션 행 */}
            <div className="login-options-row">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={keepLogin}
                  onChange={(e) => setKeepLogin(e.target.checked)}
                />
                <span>자동 로그인</span>
              </label>

              <div className="login-links-group">
                <button
                  type="button"
                  className="login-link-button"
                  onClick={() =>
                    alert("나중에 '아이디 찾기' 페이지로 연결될 예정입니다.")
                  }
                >
                  아이디 찾기
                </button>
                <span className="login-links-divider">|</span>
                <button
                  type="button"
                  className="login-link-button"
                  onClick={() =>
                    alert("나중에 '비밀번호 찾기' 페이지로 연결될 예정입니다.")
                  }
                >
                  비밀번호 찾기
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className={`login-submit ${isDisabled ? "disabled" : ""}`}
              disabled={isDisabled}
            >
              {isSubmitting ? "로그인 중..." : "로그인하기"}
            </button>

            {/* 가입 안내 */}
            <p className="login-bottom-text">
              아직 계정이 없나요?{" "}
              <button
                type="button"
                className="login-link-button strong"
                onClick={() => alert("나중에 회원가입 페이지로 연결 예정")}
              >
                회원가입
              </button>
            </p>

            {/* 구분선 */}
            <div className="login-divider">
              <span>또는</span>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="login-social-column">
              <button
                type="button"
                className="login-social-btn kakao"
                onClick={() => alert("나중에 카카오 로그인 연결 예정")}
              >
                카카오로 로그인
              </button>
              <button
                type="button"
                className="login-social-btn google"
                onClick={() => alert("나중에 구글 로그인 연결 예정")}
              >
                구글로 로그인
              </button>
              <button
                type="button"
                className="login-social-btn naver"
                onClick={() => alert("나중에 네이버 로그인 연결 예정")}
              >
                네이버로 로그인
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
