import "./BenefitFilters.css";

export default function BenefitFilters({
  selectedRegion,
  setSelectedRegion,
  selectedCategory,
  setSelectedCategory,
  freeOnly,
  setFreeOnly,
}) {
  return (
    <div className="filters">
      <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
        <option>전체</option>
        <option>서울</option>
        <option>경기</option>
        <option>부산</option>
        <option>전국</option>
      </select>

      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        <option>전체</option>
        <option>전시 할인</option>
        <option>공연 할인</option>
        <option>지역 문화 패스</option>
      </select>

      <label className="free-toggle">
        <input
          type="checkbox"
          checked={freeOnly}
          onChange={(e) => setFreeOnly(e.target.checked)}
        />
        무료만 보기
      </label>
    </div>
  );
}
