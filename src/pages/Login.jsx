// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, dummyLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1) 실제 백엔드 로그인 먼저 시도
      await login({ email, password, keepLogin });
      navigate("/mypage", { replace: true });
      return;
    } catch (err) {
      console.error("실제 로그인 실패:", err);

      // 2) 실제 로그인 실패 시 더미 계정 fallback
      const dummyEmail = "test@nomad.com";
      const dummyPassword = "1234";

      if (email === dummyEmail && password === dummyPassword) {
        dummyLogin({ email, keepLogin });
        navigate("/mypage", { replace: true });
        return;
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "아이디 또는 비밀번호가 올바르지 않습니다.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || !email || !password;

  return (
    <main className="page login-page">
      <div className="login-wrapper">
        <div className="login-brand">
          <div className="login-logo-mark">🍑</div>
          <div className="login-logo-title">문화유목민</div>
          <p className="login-logo-sub">"대학생 문화생활 플랫폼"</p>
        </div>

        <section className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
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

            {error && <div className="login-error">{error}</div>}

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

            <button
              type="submit"
              className={`login-submit ${isDisabled ? "disabled" : ""}`}
              disabled={isDisabled}
            >
              {isSubmitting ? "로그인 중..." : "로그인하기"}
            </button>

            <p className="login-bottom-text">
              아직 계정이 없나요?{" "}
              <button
                type="button"
                className="login-link-button strong"
                onClick={() => navigate("/signup")}
              >
                회원가입
              </button>
            </p>

            <div className="login-divider">
              <span>또는</span>
            </div>

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