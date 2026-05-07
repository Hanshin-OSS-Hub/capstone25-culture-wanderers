import "./BenefitFilters.css";

export default function BenefitFilters({
  regions,
  categories,
  selectedRegion,
  setSelectedRegion,
  selectedCategory,
  setSelectedCategory,
  freeOnly,
  setFreeOnly,
}) {
  return (
    <div className="filters">
      <select
        aria-label="지역 선택"
        value={selectedRegion}
        onChange={(event) => setSelectedRegion(event.target.value)}
      >
        {regions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>

      <select
        aria-label="분류 선택"
        value={selectedCategory}
        onChange={(event) => setSelectedCategory(event.target.value)}
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <label className="free-toggle">
        <input
          type="checkbox"
          checked={freeOnly}
          onChange={(event) => setFreeOnly(event.target.checked)}
        />
        무료만 보기
      </label>
    </div>
  );
}
