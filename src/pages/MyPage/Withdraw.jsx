// src/pages/MyPage/Withdraw.jsx
import React, { useState } from "react";

const STORAGE_KEY = "loggedInUser";

export default function Withdraw() {
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);

  const handleWithdraw = (e) => {
    e.preventDefault();
    if (!checked) {
      alert("안내 사항에 동의해주세요.");
      return;
    }
    if (!password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    const ok = window.confirm(
      "정말 탈퇴하시겠어요? (프론트만 구현: 실제 DB 삭제는 백엔드 연결 필요)"
    );
    if (!ok) return;

    // 백엔드 연결 전까지는 로그인 정보만 삭제
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    alert("탈퇴 처리되었습니다. (임시)");
    window.location.href = "/";
  };

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">회원탈퇴</h2>

      <div
        style={{
          padding: 14,
          borderRadius: 14,
          border: "1px solid #fee2e2",
          background: "#fff1f2",
          color: "#991b1b",
          fontSize: 13,
        }}
      >
        탈퇴 시 작성한 후기/파티 정보가 삭제될 수 있습니다. 실제 삭제는 백엔드
        연결 후 적용됩니다.
      </div>

      <form onSubmit={handleWithdraw} style={{ display: "grid", gap: 12, marginTop: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>비밀번호 확인</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          위 안내 사항을 확인했으며, 탈퇴에 동의합니다.
        </label>

        <button type="submit" style={dangerBtnStyle}>
          탈퇴하기
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #f1e4ee",
  padding: "0 12px",
  outline: "none",
};

const dangerBtnStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "#fee2e2",
  color: "#991b1b",
  cursor: "pointer",
  padding: "0 14px",
};
