import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import "./Party.css";
import axios from "axios"

export default function PartyWrite() {
  const location = useLocation();
  const navigate = useNavigate();

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
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const stateFestivalId = location.state?.festivalId;
    const stateFestivalTitle = location.state?.festivalTitle;
    const stateRegion = location.state?.region;

    const queryFestivalId = params.get('festivalId');
    const queryFestivalTitle = params.get('festivalTitle');

    const festivalTitle = stateFestivalTitle || queryFestivalTitle || '';
    const festivalRegion = stateRegion || '';

    if (festivalTitle || festivalRegion) {
      setForm((prev) => ({
        ...prev,
        festivalName: festivalTitle || prev.festivalName,
        sido: festivalRegion || prev.sido,
      }));
    }

    console.log("PartyWrite 진입 festivalId:", stateFestivalId || queryFestivalId);
    console.log("PartyWrite 진입 festivalTitle:", festivalTitle);
  }, [location.search, location.state]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleToggle = (field) => () => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const getStoredToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("authToken") ||
      ""
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = getStoredToken();

      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const params = new URLSearchParams(location.search);

      const stateFestivalId = location.state?.festivalId;
      const stateFestivalTitle = location.state?.festivalTitle;

      const queryFestivalId = params.get('festivalId');
      const queryFestivalTitle = params.get('festivalTitle');

      const festivalId = stateFestivalId || queryFestivalId;
      const festivalTitle = stateFestivalTitle || queryFestivalTitle || form.festivalName;

      const payload = {
        title: form.festivalName,
        content: form.description,
        maxPeople: parseInt(form.maxPeople, 10),
        currentPeople: 1,
        meetingTime: form.date && form.time ? `${form.date}T${form.time}:00` : null,
        location: `${form.sido} ${form.sigungu}`.trim(),
        category: form.ageRange,
        status: "RECRUITING",
        festivalId: festivalId ? Number(festivalId) : null,
        festivalTitle: festivalTitle,
      };

      console.log("PartyWrite 저장 payload:", payload);

      await axios.post(
        "http://localhost:8080/api/party-posts",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("파티 모집 글 작성 완료");
      navigate("/party");

    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "작성 실패";
      alert("작성 실패: " + errorMsg);
    }
  };

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="party-write-page">
      <div className="party-write-card">
        <h1 className="party-write-title">파티원 모집 글 작성</h1>
        <p className="party-write-sub">함께할 파티원을 찾아보세요!</p>

        <form className="party-write-form" onSubmit={handleSubmit}>
          <div className="pw-field">
            <label className="pw-label">
              <span>축제/전시 이름</span>
            </label>
            <input
              className="pw-input"
              placeholder="축제/전시를 검색하거나 입력하세요"
              value={form.festivalName}
              onChange={handleChange('festivalName')}
            />
          </div>

          <div className="pw-grid-2">
            <div className="pw-field">
              <label className="pw-label">
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

          <div className="pw-field">
            <label className="pw-label">
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

          <div className="pw-notice">
            이 글을 작성하려면 이메일/전화번호 인증이 필요합니다.
          </div>

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