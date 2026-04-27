import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { authFetch } from '../../api/authFetch';

export default function MyInfoEdit() {
  const { email, nickname, refreshProfile } = useOutletContext();

  const initialNickname = useMemo(() => nickname ?? '', [nickname]);

  const [newNickname, setNewNickname] = useState(initialNickname);
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNewNickname(initialNickname);
  }, [initialNickname]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (newPassword || newPassword2) {
      if (newPassword.length < 6) {
        alert('비밀번호는 6자 이상으로 입력해주세요.');
        return;
      }
      if (newPassword !== newPassword2) {
        alert('비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    }

    try {
      setSaving(true);
      await authFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({
          nickname: newNickname.trim(),
          password: newPassword.trim(),
        }),
      });

      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }

      setNewPassword('');
      setNewPassword2('');
      alert('내 정보가 저장되었어요.');
    } catch (error) {
      console.error('내 정보 수정 실패:', error);
      alert('내 정보 수정에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">내 정보 수정</h2>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#4b5563' }}>이메일</span>
          <input value={email} disabled style={inputStyle(true)} />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#4b5563' }}>닉네임</span>
          <input
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="닉네임"
            style={inputStyle(false)}
          />
        </label>

        <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
          비밀번호 변경은 입력한 경우에만 적용됩니다.
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#4b5563' }}>새 비밀번호</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
            style={inputStyle(false)}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#4b5563' }}>새 비밀번호 확인</span>
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            placeholder="새 비밀번호 확인"
            style={inputStyle(false)}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="submit" style={primaryBtnStyle} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
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
    border: '1px solid #f1e4ee',
    padding: '0 12px',
    background: disabled ? '#f9fafb' : '#ffffff',
    outline: 'none',
  };
}

const primaryBtnStyle = {
  height: 38,
  borderRadius: 10,
  border: '1px solid #ffc3da',
  background: '#fff3f8',
  color: '#ff538b',
  cursor: 'pointer',
  padding: '0 14px',
};
