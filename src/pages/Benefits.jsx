import React, { useMemo, useState } from "react";
import "./Benefits.css";

import { benefits } from "../data/benefits.js";
import BenefitFilters from "../components/BenefitFilters.jsx";
import BenefitCard from "../components/BenefitCard.jsx";

const ALL_FILTER = "전체";
const REGION_ORDER = [
  "전국",
  "서울",
  "경기",
  "인천",
  "부산",
  "세종",
  "충북",
  "충남",
  "강원",
  "대전",
  "광주",
  "울산",
  "지역",
];

function getRegionTags(benefit) {
  if (Array.isArray(benefit.regionTags)) {
    return benefit.regionTags;
  }

  return benefit.region
    .split(",")
    .map((region) => region.trim())
    .filter(Boolean);
}

export default function Benefits() {
  const [selectedRegion, setSelectedRegion] = useState(ALL_FILTER);
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);
  const [freeOnly, setFreeOnly] = useState(false);

  const regions = useMemo(() => {
    const uniq = Array.from(new Set(benefits.flatMap(getRegionTags)));
    const ordered = REGION_ORDER.filter((region) => uniq.includes(region));
    const rest = uniq
      .filter((region) => !REGION_ORDER.includes(region))
      .sort((a, b) => a.localeCompare(b, "ko"));

    return [ALL_FILTER, ...ordered, ...rest];
  }, []);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(benefits.map((benefit) => benefit.category)));
    return [ALL_FILTER, ...uniq];
  }, []);

  const filteredBenefits = useMemo(() => {
    return benefits.filter((benefit) => {
      if (
        selectedRegion !== ALL_FILTER &&
        !getRegionTags(benefit).includes(selectedRegion)
      ) {
        return false;
      }

      if (
        selectedCategory !== ALL_FILTER &&
        benefit.category !== selectedCategory
      ) {
        return false;
      }

      if (freeOnly && !benefit.isFree && !benefit.hasFreeItems) return false;
      return true;
    });
  }, [selectedRegion, selectedCategory, freeOnly]);

  return (
    <div className="benefits-page">
      <header className="benefits-header" />

      <div className="benefits-container">
        <BenefitFilters
          regions={regions}
          categories={categories}
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
          {filteredBenefits.map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} />
          ))}
        </div>
      </div>
    </div>
  );
}
