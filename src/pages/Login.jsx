// src/pages/Login.jsx
import React, { useState } from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 임시 계정
    const dummyEmail = "test@nomad.com";
    const dummyPassword = "1234";

    if (email === dummyEmail && password === dummyPassword) {
      localStorage.setItem("loggedInUser", email);
      alert("로그인 성공!");
      window.location.href = "/mypage";
    } else {
      alert("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <main className="page login-page">
      <div className="login-wrapper">
        {/* 상단 타이틀 */}
        <section className="login-hero">
          <h1 className="login-title">로그인</h1>
          <p className="login-sub">
            문화유목민의 파티 모집과 커뮤니티 기능은 로그인이 필요해요.
          </p>
        </section>

        {/* 로그인 카드 */}
        <section className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {/* 이메일 */}
            <div className="login-field">
              <label className="login-label">
                이메일<span className="login-required">*</span>
              </label>
              <input
                type="email"
                className="login-input"
                placeholder="이메일 주소를 입력해주세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* 비밀번호 */}
            <div className="login-field">
              <label className="login-label">
                비밀번호<span className="login-required">*</span>
              </label>
              <input
                type="password"
                className="login-input"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* 옵션들 */}
            <div className="login-options-row">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={keepLogin}
                  onChange={(e) => setKeepLogin(e.target.checked)}
                />
                <span>로그인 상태 유지</span>
              </label>
              <button
                type="button"
                className="login-link-button"
                onClick={() => alert("나중에 비밀번호 찾기 페이지로 연결 예정")}
              >
                비밀번호 찾기
              </button>
            </div>

            {/* 로그인 버튼 */}
            <button type="submit" className="login-submit">
              로그인
            </button>

            {/* 구분선 */}
            <div className="login-divider">
              <span>또는</span>
            </div>

            {/* 소셜 로그인 (모양만) */}
            <div className="login-social-row">
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
            </div>

            {/* 가입 안내 */}
            <p className="login-bottom-text">
              아직 회원이 아니신가요?{" "}
              <button
                type="button"
                className="login-link-button strong"
                onClick={() => alert("나중에 회원가입 페이지로 연결 예정")}
              >
                회원가입 하러 가기
              </button>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
