import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import "./Party.css";

const SIDO_OPTIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const SIGUNGU_MAP = {
  서울특별시: ["종로구", "중구", "용산구", "성동구", "광진구", "마포구", "서초구", "강남구", "송파구"],
  부산광역시: ["중구", "해운대구", "수영구", "부산진구", "동래구", "사하구"],
  대구광역시: ["중구", "수성구", "달서구", "북구"],
  인천광역시: ["중구", "연수구", "남동구", "부평구", "서구"],
  광주광역시: ["동구", "서구", "남구", "북구", "광산구"],
  대전광역시: ["동구", "중구", "서구", "유성구", "대덕구"],
  울산광역시: ["중구", "남구", "동구", "북구", "울주군"],
  세종특별자치시: ["세종시"],
  경기도: ["수원시", "성남시", "고양시", "용인시", "부천시", "광주시", "이천시", "가평군", "양주시"],
  강원특별자치도: ["춘천시", "원주시", "강릉시", "속초시", "홍천군"],
  충청북도: ["청주시", "충주시", "제천시", "단양군"],
  충청남도: ["천안시", "공주시", "보령시", "아산시", "서산시"],
  전북특별자치도: ["전주시", "군산시", "익산시", "남원시", "완주군"],
  전라남도: ["목포시", "여수시", "순천시", "나주시", "보성군"],
  경상북도: ["포항시", "경주시", "안동시", "구미시", "영주시"],
  경상남도: ["창원시", "진주시", "통영시", "김해시", "양산시"],
  제주특별자치도: ["제주시", "서귀포시"],
};

const AGE_RANGE_OPTIONS = ["대학생", "20대", "30대", "연령 무관"];
const GENDER_LIMIT_OPTIONS = ["제한 없음", "남성만", "여성만"];

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("authToken") ||
    ""
  );
}

function joinDateTime(date, time) {
  if (!date || !time) return "";
  return `${date}T${time}:00`;
}

function normalizeSido(value) {
  if (!value) return "";
  if (SIDO_OPTIONS.includes(value)) return value;

  const aliasMap = {
    서울: "서울특별시",
    부산: "부산광역시",
    대구: "대구광역시",
    인천: "인천광역시",
    광주: "광주광역시",
    대전: "대전광역시",
    울산: "울산광역시",
    세종: "세종특별자치시",
    경기: "경기도",
    강원: "강원특별자치도",
    충북: "충청북도",
    충남: "충청남도",
    전북: "전북특별자치도",
    전남: "전라남도",
    경북: "경상북도",
    경남: "경상남도",
    제주: "제주특별자치도",
  };

  return aliasMap[String(value).trim()] || String(value).trim();
}

export default function PartyWrite() {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    festivalName: "",
    sido: "",
    sigungu: "",
    date: "",
    time: "",
    maxPeople: "4",
    ageRange: "대학생",
    genderLimit: "제한 없음",
    description: "",
    contact: "",
    allowComments: true,
    hasDeadline: false,
    deadlineDate: "",
    deadlineTime: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const festivalTitle = location.state?.festivalTitle || params.get("festivalTitle") || "";
    const initialRegion = normalizeSido(location.state?.region || "");

    if (!festivalTitle && !initialRegion) return;

    setForm((prev) => ({
      ...prev,
      festivalName: festivalTitle || prev.festivalName,
      sido: initialRegion || prev.sido,
      sigungu: "",
    }));
  }, [location.search, location.state]);

  const sigunguOptions = useMemo(() => SIGUNGU_MAP[form.sido] || [], [form.sido]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "sido" ? { sigungu: "" } : {}),
    }));
  };

  const handleToggle = (field) => () => {
    setForm((prev) => ({
      ...prev,
      [field]: !prev[field],
      ...(field === "hasDeadline" && prev.hasDeadline
        ? { deadlineDate: "", deadlineTime: "" }
        : {}),
    }));
  };

  const validate = () => {
    if (!form.festivalName.trim()) return "축제/전시 이름을 입력해주세요.";
    if (!form.sido.trim()) return "시/도를 선택해주세요.";
    if (!form.date || !form.time) return "모임 날짜와 시간을 입력해주세요.";
    if (Number(form.maxPeople) < 2) return "모집 인원은 2명 이상이어야 해요.";
    if (!form.description.trim()) return "상세 설명을 입력해주세요.";
    if (!form.contact.trim()) return "연락 방법을 입력해주세요.";

    const meetingAt = joinDateTime(form.date, form.time);
    if (meetingAt && new Date(meetingAt).getTime() <= Date.now()) {
      return "모임 일시는 현재 시간보다 이후여야 해요.";
    }

    if (form.hasDeadline) {
      if (!form.deadlineDate || !form.deadlineTime) {
        return "모집 마감일과 시간을 입력해주세요.";
      }

      const deadlineAt = joinDateTime(form.deadlineDate, form.deadlineTime);
      if (new Date(deadlineAt).getTime() <= Date.now()) {
        return "모집 마감일은 현재 시간보다 이후여야 해요.";
      }
      if (new Date(deadlineAt).getTime() >= new Date(meetingAt).getTime()) {
        return "모집 마감일은 모임 일시보다 빨라야 해요.";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validate();
    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    try {
      const token = getStoredToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const params = new URLSearchParams(location.search);
      const festivalId = location.state?.festivalId || params.get("festivalId");
      const festivalTitle = location.state?.festivalTitle || params.get("festivalTitle") || form.festivalName.trim();

      const payload = {
        title: form.festivalName.trim(),
        content: form.description.trim(),
        maxPeople: parseInt(form.maxPeople, 10),
        currentPeople: 1,
        meetingTime: joinDateTime(form.date, form.time),
        deadline: form.hasDeadline ? joinDateTime(form.deadlineDate, form.deadlineTime) : null,
        location: [form.sido, form.sigungu].filter(Boolean).join(" ").trim(),
        category: `${form.ageRange} / ${form.genderLimit}`,
        contact: form.contact.trim(),
        status: "RECRUITING",
        festivalId: festivalId ? Number(festivalId) : null,
        festivalTitle,
      };

      await axios.post("http://localhost:8080/api/party-posts", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("파티 모집 글 작성이 완료되었어요.");
      navigate("/party");
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data || "작성에 실패했어요.";
      alert(`작성 실패: ${errorMsg}`);
    }
  };

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
              placeholder="축제/전시 이름을 입력해주세요"
              value={form.festivalName}
              onChange={handleChange("festivalName")}
            />
          </div>

          <div className="pw-grid-2">
            <div className="pw-field">
              <label className="pw-label">
                <span>지역</span>
              </label>
              <div className="pw-grid-2 pw-grid-gap8">
                <select className="pw-input" value={form.sido} onChange={handleChange("sido")}>
                  <option value="">시/도</option>
                  {SIDO_OPTIONS.map((sido) => (
                    <option key={sido} value={sido}>
                      {sido}
                    </option>
                  ))}
                </select>
                <select className="pw-input" value={form.sigungu} onChange={handleChange("sigungu")}>
                  <option value="">시/군/구</option>
                  {sigunguOptions.map((sigungu) => (
                    <option key={sigungu} value={sigungu}>
                      {sigungu}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pw-field">
              <label className="pw-label">
                <span className="pw-label-icon">🕒</span>
                <span>날짜 및 시간</span>
              </label>
              <div className="pw-grid-2 pw-grid-gap8">
                <input type="date" className="pw-input" value={form.date} onChange={handleChange("date")} />
                <input type="time" className="pw-input" value={form.time} onChange={handleChange("time")} />
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
                <input className="pw-input" type="number" min={2} value={form.maxPeople} onChange={handleChange("maxPeople")} />
                <span className="pw-inline-suffix">명</span>
              </div>
            </div>

            <div className="pw-field">
              <label className="pw-label">
                <span className="pw-label-icon">🎓</span>
                <span>연령대</span>
              </label>
              <select className="pw-input" value={form.ageRange} onChange={handleChange("ageRange")}>
                {AGE_RANGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pw-field">
            <label className="pw-label">
              <span>성별 제한</span>
            </label>
            <select className="pw-input" value={form.genderLimit} onChange={handleChange("genderLimit")}>
              {GENDER_LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="pw-field">
            <label className="pw-label">
              <span className="pw-label-icon">📝</span>
              <span>세부 설명</span>
            </label>
            <textarea
              className="pw-input pw-textarea"
              placeholder="함께 즐길 축제/전시에 대한 설명, 일정, 만날 장소 등을 자유롭게 적어주세요."
              rows={4}
              value={form.description}
              onChange={handleChange("description")}
            />
          </div>

          <div className="pw-field">
            <label className="pw-label">
              <span className="pw-label-icon">📞</span>
              <span>연락 방법</span>
            </label>
            <input
              className="pw-input"
              placeholder="오픈채팅 링크, 인스타 ID, 이메일 등을 입력해주세요"
              value={form.contact}
              onChange={handleChange("contact")}
            />
          </div>

          <div className="pw-switch-row">
            <div className="pw-switch-item">
              <span>댓글 허용</span>
              <button type="button" className={`pw-switch ${form.allowComments ? "on" : ""}`} onClick={handleToggle("allowComments")}>
                <span className="pw-switch-thumb" />
              </button>
            </div>

            <div className="pw-switch-item">
              <span>모집 마감일 설정</span>
              <button type="button" className={`pw-switch ${form.hasDeadline ? "on" : ""}`} onClick={handleToggle("hasDeadline")}>
                <span className="pw-switch-thumb" />
              </button>
            </div>
          </div>

          {form.hasDeadline ? (
            <div className="pw-grid-2">
              <div className="pw-field">
                <label className="pw-label">
                  <span>마감 날짜</span>
                </label>
                <input type="date" className="pw-input" value={form.deadlineDate} onChange={handleChange("deadlineDate")} />
              </div>
              <div className="pw-field">
                <label className="pw-label">
                  <span>마감 시간</span>
                </label>
                <input type="time" className="pw-input" value={form.deadlineTime} onChange={handleChange("deadlineTime")} />
              </div>
            </div>
          ) : null}

          <div className="pw-notice">모집 마감일을 켜면 해당 시각 이후에는 자동으로 신청이 막혀요.</div>

          <div className="pw-actions">
            <button type="button" className="pw-btn pw-btn-outline" onClick={() => navigate(-1)}>
              취소
            </button>
            <button type="submit" className="pw-btn pw-btn-primary">
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
