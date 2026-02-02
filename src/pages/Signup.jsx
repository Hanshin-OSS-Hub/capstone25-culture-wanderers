// src/pages/Signup.jsx
import React, { useMemo, useState } from "react";
import "./Signup.css";
import UniversityAutocomplete from "../components/UniversityAutocomplete";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // 영문+숫자 8자 이상
const PHONE_RE = /^\d{3}-?\d{3,4}-?\d{4}$/;

export default function Signup() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    school: "",
    birthYear: "",
    phone: "",
    smsCode: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 필수 체크 상태
  const [emailChecked, setEmailChecked] = useState(null); // null | true | false
  const [nicknameChecked, setNicknameChecked] = useState(null);
  const [smsSent, setSmsSent] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const years = useMemo(() => Array.from({ length: 30 }, (_, i) => String(2007 - i)), []);
  const schools = useMemo(
  () => [
    "서울대학교",
    "연세대학교",
    "고려대학교",
    "성균관대학교",
    "한양대학교",
    "중앙대학교",
    "경희대학교",
    "건국대학교",
    "홍익대학교",
    "인하대학교",
    "한신대학교",
  ],
  []
);

const fieldError = useMemo(() => {
  const e = {};

  // 이메일
  if (!form.email) e.email = "이메일을 입력해주세요.";
  else if (!EMAIL_RE.test(form.email)) e.email = "이메일 형식이 올바르지 않습니다.";

  // 비번
  if (!form.password) e.password = "비밀번호를 입력해주세요.";
  else if (!PW_RE.test(form.password)) e.password = "영문/숫자 조합 8자 이상으로 입력해주세요.";

  // 비번 확인
  if (!form.passwordConfirm) e.passwordConfirm = "비밀번호 확인을 입력해주세요.";
  else if (form.passwordConfirm !== form.password) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";

  // 닉네임
  if (!form.nickname) e.nickname = "닉네임을 입력해주세요.";
  else if (form.nickname.length < 2 || form.nickname.length > 10)
    e.nickname = "닉네임은 2~10자로 입력해주세요.";

  //  중복확인(필수)
  if (emailChecked !== true) e.emailChecked = "이메일 중복확인을 완료해주세요.";
  if (nicknameChecked !== true) e.nicknameChecked = "닉네임 중복확인을 완료해주세요.";

  //  전화번호: 선택
  // - 입력했을 때만 형식 검사
  if (form.phone && !PHONE_RE.test(form.phone)) {
    e.phone = "전화번호 형식이 올바르지 않습니다. (예: 010-0000-0000)";
  }

  //  인증도 선택: 아래 줄이 '없어야' 선택이 됨
  // (즉, smsVerified를 에러 조건에 넣지 않는다)

  //  약관 필수 2개
  if (!form.agreeTerms) e.agreeTerms = "서비스 이용약관에 동의해주세요.";
  if (!form.agreePrivacy) e.agreePrivacy = "개인정보 처리방침에 동의해주세요.";

  return e;
}, [form, emailChecked, nicknameChecked]);


  const isDisabled = useMemo(() => {
    if (isSubmitting) return true;
    return Object.keys(fieldError).length > 0;
  }, [isSubmitting, fieldError]);

  const phoneValid = PHONE_RE.test(form.phone);

  const setField = (key, val) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: val }));

    // 값 변경 시 필수 확인 상태 초기화
    if (key === "email") setEmailChecked(null);
    if (key === "nickname") setNicknameChecked(null);

    // 전화번호 변경 시 인증 초기화
    if (key === "phone") {
      setSmsSent(false);
      setSmsVerified(false);
      setForm((prev) => ({ ...prev, smsCode: "" }));
    }
  };

  // ======= 여기 4개는 나중에 API로 교체하면 됨 =======
  const checkEmail = async () => {
    setError("");
    if (!EMAIL_RE.test(form.email)) {
      setEmailChecked(false);
      setError("이메일 형식을 확인해주세요.");
      return;
    }
    // TODO: POST /auth/check-email
    setEmailChecked(true);
  };

  const checkNickname = async () => {
    setError("");
    if (form.nickname.length < 2 || form.nickname.length > 10) {
      setNicknameChecked(false);
      setError("닉네임은 2~10자로 입력해주세요.");
      return;
    }
    // TODO: POST /auth/check-nickname
    setNicknameChecked(true);
  };

  const sendSms = async () => {
    setError("");
    if (!phoneValid) {
      setError("전화번호 형식을 확인해주세요.");
      return;
    }
    // TODO: POST /auth/send-sms
    setSmsSent(true);
    setSmsVerified(false);
  };

  const verifySms = async () => {
    setError("");
    if (form.smsCode.trim().length < 4) {
      setError("인증번호를 확인해주세요.");
      return;
    }
    // TODO: POST /auth/verify-sms
    setSmsVerified(true);
  };
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Object.keys(fieldError).length > 0) {
      // 우선순위로 한 줄만 보여주기
      const first = Object.values(fieldError)[0];
      setError(first);
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: POST /auth/signup
      // await api.signup({ ...form });

      alert("회원가입 완료(예시)!");
      window.location.href = "/login";
    } catch (err) {
      setError("회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page login-page">
      <div className="login-wrapper">
        {/* 상단 브랜드 영역 (Login과 동일 톤) */}
        <div className="login-brand">
          <div className="login-logo-mark">🍑</div>
          <div className="login-logo-title">문화유목민</div>
          <p className="login-logo-sub">"대학생 문화생활 플랫폼"</p>
        </div>

        {/* 카드 */}
        <section className="login-card signup-card">
          <form className="login-form" onSubmit={handleSubmit}>
            {/* 이메일 */}
            <div className="login-field">
              <label className="login-label">이메일</label>
              <div className="signup-row">
                <input
                  type="email"
                  className="login-input"
                  placeholder="이메일을 입력하세요"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
                <button type="button" className="signup-mini-btn" onClick={checkEmail}>
                  중복확인
                </button>
              </div>
              {emailChecked === true && <div className="signup-ok">✓ 사용 가능한 이메일입니다.</div>}
              {fieldError.emailChecked && (
                <div className="login-error">{fieldError.emailChecked}</div>
                )}

            </div>

            {/* 비밀번호 */}
            <div className="login-field">
              <label className="login-label">비밀번호</label>
              <div className="signup-with-icon">
                <input
                  type={showPw ? "text" : "password"}
                  className="login-input"
                  placeholder="영문/숫자 조합 8자 이상"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                />
                <button type="button" className="signup-icon-btn" onClick={() => setShowPw((p) => !p)}>
                  {showPw ? "숨김" : "보기"}
                </button>
              </div>
               {fieldError.password && (
                <div className="login-error">{fieldError.password}</div>
                )}
            </div>

            {/* 비밀번호 확인 */}
            <div className="login-field">
              <label className="login-label">비밀번호 확인</label>
              <div className="signup-with-icon">
                <input
                  type={showPw2 ? "text" : "password"}
                  className="login-input"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={form.passwordConfirm}
                  onChange={(e) => setField("passwordConfirm", e.target.value)}
                />
                <button type="button" className="signup-icon-btn" onClick={() => setShowPw2((p) => !p)}>
                  {showPw2 ? "숨김" : "보기"}
                </button>
              </div>
              {fieldError.passwordConfirm && (
                <div className="login-error">{fieldError.passwordConfirm}</div>
                 )}
            </div>

            {/* 닉네임 */}
            <div className="login-field">
              <label className="login-label">닉네임</label>
              <div className="signup-row">
                <input
                  type="text"
                  className="login-input"
                  placeholder="닉네임(2~10자)"
                  value={form.nickname}
                  onChange={(e) => setField("nickname", e.target.value)}
                />
                <button type="button" className="signup-mini-btn" onClick={checkNickname}>
                  중복확인
                </button>
              </div>
              {nicknameChecked === true && <div className="signup-ok">✓ 사용 가능한 닉네임입니다.</div>}
              {fieldError.nicknameChecked && (
                 <div className="login-error">{fieldError.nicknameChecked}</div>
                 )}

            </div>

            {/* 학교 (선택) */}
            <div className="login-field">
            <label className="login-label">학교 (선택)</label>

            <UniversityAutocomplete
            value={form.school}
            onChange={(v) => setField("school", v)}
            list={(schools || []).filter((s) => s !== "")}  // ✅ 안전
            placeholder="학교명을 입력하세요 (예: 한)"
            />

            </div>

            {/* 출생연도 (선택) */}
            <div className="login-field">
              <label className="login-label">출생연도 (선택)</label>
              <select
                className="signup-select"
                value={form.birthYear}
                onChange={(e) => setField("birthYear", e.target.value)}
              >
                <option value="">출생연도를 선택하세요</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* 전화번호 + 인증 */}
            <div className="login-field">
              <label className="login-label">전화번호 (선택)</label>
              <div className="signup-row">
                <input
                  type="text"
                  className="login-input"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
                <button
                  type="button"
                  className="signup-mini-btn"
                  onClick={sendSms}
                  disabled={!phoneValid}
                  title={!phoneValid ? "전화번호 형식을 먼저 맞춰주세요" : ""}
                >
                  인증번호 발송
                </button>
              </div>
              {fieldError.phone && (
                <div className="login-error">{fieldError.phone}</div>
                )}
                

              {smsSent && (
                <div className="signup-row signup-mt8">
                  <input
                    type="text"
                    className="login-input"
                    placeholder="인증번호 입력"
                    value={form.smsCode}
                    onChange={(e) => setField("smsCode", e.target.value)}
                  />
                  <button type="button" className="signup-mini-btn outline" onClick={verifySms}>
                    확인
                  </button>
                  <span className={`signup-status ${smsVerified ? "ok" : ""}`}>
                    {smsVerified ? "인증 완료" : "인증 대기"}
                  </span>
                </div>
              )}
            </div>

            {/* 에러 메시지 (Login 스타일 재사용) */}
            {error && <div className="login-error">{error}</div>}

            {/* 약관 */}
            <div className="signup-terms">
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setField("agreeTerms", e.target.checked)}
                />
                <span>[필수] 서비스 이용약관 동의</span>
              </label>
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={form.agreePrivacy}
                  onChange={(e) => setField("agreePrivacy", e.target.checked)}
                />
                <span>[필수] 개인정보 처리방침 동의</span>
              </label>
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={form.agreeMarketing}
                  onChange={(e) => setField("agreeMarketing", e.target.checked)}
                />
                <span>[선택] 혜택/이벤트 알림 수신 동의</span>
              </label>
            </div>

            {/* 회원가입 버튼 (Login 버튼 톤 그대로) */}
            <button
              type="submit"
              className={`login-submit ${isDisabled ? "disabled" : ""}`}
              disabled={isDisabled}
            >
              {isSubmitting ? "가입 중..." : "회원가입 완료"}
            </button>

            {/* 로그인 이동 */}
            <p className="login-bottom-text">
              이미 계정이 있나요?{" "}
              <button
                type="button"
                className="login-link-button strong"
                onClick={() => (window.location.href = "/login")}
              >
                로그인
              </button>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
