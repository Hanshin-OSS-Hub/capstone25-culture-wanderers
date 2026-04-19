// src/pages/MyPage/MyInfoEdit.jsx
import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const STORAGE_KEY = "loggedInUser";

export default function MyInfoEdit() {
  const { email, nickname } = useOutletContext();

  // 프론트만 완성 버전: 일단 닉네임/비밀번호만
  const initialNickname = useMemo(() => nickname ?? "", [nickname]);

  const [newNickname, setNewNickname] = useState(initialNickname);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newNickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    if (newPassword || newPassword2) {
      if (newPassword.length < 6) {
        alert("비밀번호는 6자 이상으로 입력해주세요.");
        return;
      }
      if (newPassword !== newPassword2) {
        alert("비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    // 백엔드 연결 전까지는 UX만 제공
    // 닉네임을 저장해두고 싶으면(임시): loggedInUser 대신 별도 키로 저장 추천
    // 여기서는 최소한의 임시 저장만 제공
    localStorage.setItem(`${STORAGE_KEY}:nickname`, newNickname.trim());

    alert("저장되었습니다. (백엔드 연결 시 실제 DB 반영)");
  };

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">내 정보 수정</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>이메일</span>
          <input value={email} disabled style={inputStyle(true)} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>닉네임</span>
          <input
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="닉네임"
            style={inputStyle(false)}
          />
        </label>

        <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
          비밀번호 변경은 입력한 경우에만 적용됩니다.
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>새 비밀번호</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
            style={inputStyle(false)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>새 비밀번호 확인</span>
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            placeholder="새 비밀번호 확인"
            style={inputStyle(false)}
          />
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="submit" style={primaryBtnStyle}>
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

function inputStyle(disabled) {
  return {
    height: 38,
    borderRadius: 10,
    border: "1px solid #f1e4ee",
    padding: "0 12px",
    background: disabled ? "#f9fafb" : "#ffffff",
    outline: "none",
  };
}

const primaryBtnStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #ffc3da",
  background: "#fff3f8",
  color: "#ff538b",
  cursor: "pointer",
  padding: "0 14px",
};
