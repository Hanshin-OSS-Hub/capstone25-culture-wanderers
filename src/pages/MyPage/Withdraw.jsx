import React, { useState } from "react";

import { authFetch } from "../../api/authFetch";

const STORAGE_KEYS = ["loggedInUser", "token", "nickname"];

export default function Withdraw() {
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const clearLoginStorage = () => {
    STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    setError("");

    if (!checked) {
      setError("삭제 안내를 확인하고 동의해주세요.");
      return;
    }
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    const ok = window.confirm(
      "작성자가 한 활동들(게시글, 댓글, 리뷰 등)이 모두 삭제됩니다. 탈퇴하겠습니까?"
    );
    if (!ok) return;

    try {
      setSubmitting(true);
      await authFetch("/api/me", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      });
      clearLoginStorage();
      alert("회원탈퇴가 완료되었습니다.");
      window.location.href = "/";
    } catch (err) {
      const message = String(err?.message || "");
      if (message.includes("비밀번호")) {
        setError("비밀번호가 일치하지 않습니다.");
      } else {
        setError("회원탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">회원탈퇴</h2>

      <div style={warningStyle}>
        회원탈퇴 시 작성한 게시글, 댓글, 리뷰, 파티 모집글, 방문 인증, 저장/좋아요,
        캘린더 일정 등 계정 활동이 모두 삭제되며 복구할 수 없습니다.
      </div>

      <form onSubmit={handleWithdraw} style={{ display: "grid", gap: 12, marginTop: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>비밀번호 확인</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력해주세요"
            style={inputStyle}
            disabled={submitting}
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            disabled={submitting}
          />
          위 안내 사항을 확인했으며, 계정 활동 삭제와 탈퇴에 동의합니다.
        </label>

        {error ? <p style={errorStyle}>{error}</p> : null}

        <button type="submit" style={dangerBtnStyle} disabled={submitting}>
          {submitting ? "탈퇴 처리 중..." : "탈퇴하기"}
        </button>
      </form>
    </div>
  );
}

const warningStyle = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid #fecdd3",
  background: "#fff1f5",
  color: "#9f1239",
  fontSize: 13,
  lineHeight: 1.7,
};

const inputStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #f1e4ee",
  padding: "0 12px",
  outline: "none",
};

const errorStyle = {
  margin: 0,
  color: "#e11d48",
  fontSize: 13,
};

const dangerBtnStyle = {
  height: 40,
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "#fee2e2",
  color: "#991b1b",
  cursor: "pointer",
  padding: "0 14px",
  fontWeight: 700,
};
