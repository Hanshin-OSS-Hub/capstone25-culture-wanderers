import { useState } from 'react'
import "./Party.css";


export default function PartyWrite() {
  const [form, setForm] = useState({
    festivalName: '',
    sido: '',
    sigungu: '',
    date: '',
    time: '',
    maxPeople: '4',
    ageRange: '대학생',
    genderLimit: '제한 없음',
    description: '',
    contact: '',
    allowComments: true,
    hasDeadline: false,
  })

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleToggle = (field) => () => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: 나중에 실제 API 연결
    alert('임시로 폼 데이터가 콘솔에 출력됩니다!')
    console.log(form)
  }

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="party-write-page">
      <div className="party-write-card">
        <h1 className="party-write-title">파티원 모집 글 작성</h1>
        <p className="party-write-sub">함께할 파티원을 찾아보세요!</p>

        <form className="party-write-form" onSubmit={handleSubmit}>
          {/* 1. 축제 / 전시 이름 */}
          <div className="pw-field">
            <label className="pw-label">
              <span className="pw-label-icon">🎫</span>
              <span>축제/전시 이름</span>
            </label>
            <input
              className="pw-input"
              placeholder="축제/전시를 검색하거나 입력하세요"
              value={form.festivalName}
              onChange={handleChange('festivalName')}
            />
          </div>

          {/* 2. 지역 + 날짜/시간 (2열) */}
          <div className="pw-grid-2">
            <div className="pw-field">
              <label className="pw-label">
                <span className="pw-label-icon">📍</span>
                <span>지역</span>
              </label>
              <div className="pw-grid-2 pw-grid-gap8">
                <select
                  className="pw-input"
                  value={form.sido}
                  onChange={handleChange('sido')}
                >
                  <option value="">시/도</option>
                  <option value="서울">서울</option>
                  <option value="부산">부산</option>
                  <option value="경기">경기</option>
                </select>
                <select
                  className="pw-input"
                  value={form.sigungu}
                  onChange={handleChange('sigungu')}
                >
                  <option value="">시/군/구</option>
                  <option value="마포구">마포구</option>
                  <option value="해운대구">해운대구</option>
                </select>
              </div>
            </div>

            <div className="pw-field">
              <label className="pw-label">
                <span className="pw-label-icon">🕒</span>
                <span>날짜 및 시간</span>
              </label>
              <div className="pw-grid-2 pw-grid-gap8">
                <input
                  type="date"
                  className="pw-input"
                  value={form.date}
                  onChange={handleChange('date')}
                />
                <input
                  type="time"
                  className="pw-input"
                  value={form.time}
                  onChange={handleChange('time')}
                />
              </div>
            </div>
          </div>

          {/* 3. 모집 인원 + 연령대 (2열) */}
          <div className="pw-grid-2">
            <div className="pw-field">
              <label className="pw-label">
                <span className="pw-label-icon">👥</span>
                <span>모집 인원</span>
              </label>
              <div className="pw-inline">
                <input
                  className="pw-input"
                  value={form.maxPeople}
                  onChange={handleChange('maxPeople')}
                />
                <span className="pw-inline-suffix">명</span>
              </div>
            </div>

            <div className="pw-field">
              <label className="pw-label">
                <span className="pw-label-icon">🎓</span>
                <span>연령대</span>
              </label>
              <select
                className="pw-input"
                value={form.ageRange}
                onChange={handleChange('ageRange')}
              >
                <option value="대학생">대학생</option>
                <option value="20대">20대</option>
                <option value="30대">30대</option>
                <option value="연령 무관">연령 무관</option>
              </select>
            </div>
          </div>

          {/* 4. 성별 제한 */}
          <div className="pw-field">
            <label className="pw-label">
              <span className="pw-label-icon">🚻</span>
              <span>성별 제한</span>
            </label>
            <select
              className="pw-input"
              value={form.genderLimit}
              onChange={handleChange('genderLimit')}
            >
              <option value="제한 없음">제한 없음</option>
              <option value="여성만">여성만</option>
              <option value="남성만">남성만</option>
            </select>
          </div>

          {/* 5. 세부 설명 */}
          <div className="pw-field">
            <label className="pw-label">
              <span className="pw-label-icon">📝</span>
              <span>세부 설명</span>
            </label>
            <textarea
              className="pw-input pw-textarea"
              placeholder="함께 즐길 축제/전시에 대한 설명, 일정, 만남 장소 등을 자유롭게 작성해주세요."
              rows={4}
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>

          {/* 6. 연락 방법 */}
          <div className="pw-field">
            <label className="pw-label">
              <span className="pw-label-icon">📞</span>
              <span>연락 방법</span>
            </label>
            <input
              className="pw-input"
              placeholder="오픈채팅 링크, 디엠 등 연락 방법을 입력해주세요"
              value={form.contact}
              onChange={handleChange('contact')}
            />
          </div>

          {/* 7. 댓글 허용 + 마감일 설정 (스위치 2개) */}
          <div className="pw-switch-row">
            <div className="pw-switch-item">
              <span>댓글 허용</span>
              <button
                type="button"
                className={`pw-switch ${form.allowComments ? 'on' : ''}`}
                onClick={handleToggle('allowComments')}
              >
                <span className="pw-switch-thumb" />
              </button>
            </div>

            <div className="pw-switch-item">
              <span>모집 마감일 설정</span>
              <button
                type="button"
                className={`pw-switch ${form.hasDeadline ? 'on' : ''}`}
                onClick={handleToggle('hasDeadline')}
              >
                <span className="pw-switch-thumb" />
              </button>
            </div>
          </div>

          {/* 8. 안내 박스 */}
          <div className="pw-notice">
            이 글을 작성하려면 이메일/전화번호 인증이 필요합니다.
          </div>

          {/* 9. 버튼 영역 */}
          <div className="pw-actions">
            <button
              type="button"
              className="pw-btn pw-btn-outline"
              onClick={handleCancel}
            >
              취소
            </button>
            <button type="submit" className="pw-btn pw-btn-primary">
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
