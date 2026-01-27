import React from "react";
import "./Benefits.css"; 

export default function Benefits() {
  const benefits = [
    {
      id: 1,
      title: "서울시 청년문화패스",
      badge: "학생 할인",
      age: "만 19~24세 서울시민",
      desc: "공연·전시 관람 지원 1인당(연간) 20만원 문화이용권(카드) 지급",
      note: "서울 내 일부 공연은 제외될 수 있습니다.",
    },
    {
      id: 2,
      title: "국립중앙박물관 대학생 무료입장",
      badge: "무료",
      age: "대학생 (재학생)",
      desc: "상설전시 무료 관람, 특별전은 대학생 대상 수요일 50% 할인",
      note: "학생증 지참 필수",
    },
    {
      id: 3,
      title: "경기문화재단 청년문화예술카드",
      badge: "청년",
      age: "만 19~34세 경기도민",
      desc: "연간 10~15만원 공연/전시 관람비 지원, 온·오프라인 결제 가능",
      note: "연 1회 신청, 예산 소진 시 마감",
    },
  ];

  return (
    <div className="benefits-page">
      <header className="benefits-header">
        <p className="benefits-kicker">대학생 전용 혜택 모음</p>
        <h1 className="benefits-title">학생 할인 모아보기</h1>
        <p className="benefits-sub">
          학생증만 있으면 받을 수 있는 할인/무료 입장 정보를 모았어요.
        </p>
      </header>

      <section className="benefits-filter-bar">
        <div className="benefits-filter-group">
          <span className="benefits-filter-label">지역</span>
          <select className="benefits-select">
            <option>전체</option>
            <option>서울</option>
            <option>경기</option>
            <option>인천</option>
          </select>
        </div>
        <div className="benefits-filter-group">
          <span className="benefits-filter-label">혜택 종류</span>
          <select className="benefits-select">
            <option>전체</option>
            <option>무료 입장</option>
            <option>할인</option>
            <option>문화포인트</option>
          </select>
        </div>
        <label className="benefits-checkbox">
          <input type="checkbox" />
          <span>무료만 보기</span>
        </label>
      </section>

      <section className="benefits-list">
        {benefits.map((b) => (
          <article key={b.id} className="benefit-card">
            <div className="benefit-chip-row">
              <span className="benefit-chip">{b.badge}</span>
            </div>
            <h2 className="benefit-card-title">{b.title}</h2>
            <p className="benefit-target">{b.age}</p>
            <p className="benefit-desc">{b.desc}</p>
            <p className="benefit-note">{b.note}</p>
            <button className="benefit-button">자세히 보기</button>
          </article>
        ))}
      </section>
    </div>
  );
}
