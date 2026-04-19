import React, { useMemo, useState } from "react";
import "./Benefits.css";

import { benefits } from "../data/benefits";
import BenefitFilters from "../components/BenefitFilters";
import BenefitCard from "../components/BenefitCard";

export default function Benefits() {
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [freeOnly, setFreeOnly] = useState(false);

  const regions = useMemo(() => {
    const uniq = Array.from(new Set(benefits.map((b) => b.region)));
    return ["전체", ...uniq];
  }, []);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(benefits.map((b) => b.category)));
    return ["전체", ...uniq];
  }, []);

  const filteredBenefits = useMemo(() => {
    return benefits.filter((b) => {
      if (selectedRegion !== "전체" && b.region !== selectedRegion) return false;
      if (selectedCategory !== "전체" && b.category !== selectedCategory) return false;
      if (freeOnly && !b.isFree) return false;
      return true;
    });
  }, [selectedRegion, selectedCategory, freeOnly]);

  return (
  <div className="benefits-page">
    <header className="benefits-header">
      {/* ... 기존 헤더 ... */}
    </header>

    {/* ✅ 여기! 카드 영역 폭과 동일한 래퍼 */}
    <div className="benefits-container">
      <BenefitFilters
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        freeOnly={freeOnly}
        setFreeOnly={setFreeOnly}
      />

      <div className="benefits-count">
        총 <span>{filteredBenefits.length}개</span>의 혜택이 있어요
      </div>

      <div className="benefits-list">
        {filteredBenefits.map((b) => (
          <BenefitCard key={b.id} benefit={b} />
        ))}
      </div>
    </div>
  </div>
);

}
