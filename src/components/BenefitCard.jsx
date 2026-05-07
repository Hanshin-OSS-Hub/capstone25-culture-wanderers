import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./BenefitCard.css";

function splitDetailLabel(label) {
  const separator = " - ";
  const index = label.indexOf(separator);

  if (index === -1) {
    return { title: label, action: "상세 보기" };
  }

  return {
    title: label.slice(0, index),
    action: label.slice(index + separator.length),
  };
}

function groupDetailLinks(detailLinks) {
  const grouped = new Map();

  detailLinks.forEach((item) => {
    const { title, action } = splitDetailLabel(item.label);

    if (!grouped.has(title)) {
      grouped.set(title, {
        title,
        links: [],
      });
    }

    const group = grouped.get(title);
    const isDuplicate = group.links.some(
      (link) => link.url === item.url && link.label === action,
    );

    if (!isDuplicate) {
      group.links.push({
        label: action,
        url: item.url,
      });
    }
  });

  return Array.from(grouped.values());
}

export default function BenefitCard({ benefit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasPriceInfo =
    typeof benefit.originalPrice === "number" &&
    typeof benefit.studentPrice === "number";
  const hasDetailLinks =
    Array.isArray(benefit.detailLinks) && benefit.detailLinks.length > 0;
  const isCategorySummary = String(benefit.id).startsWith("cat-");
  const detailGroups = useMemo(
    () => (hasDetailLinks ? groupDetailLinks(benefit.detailLinks) : []),
    [benefit.detailLinks, hasDetailLinks],
  );

  const savedAmount = hasPriceInfo
    ? benefit.originalPrice - benefit.studentPrice
    : 0;

  return (
    <div className="card">
      <div className="card-header">
        <h3>{benefit.name}</h3>
        {benefit.isFree && <span className="badge">무료</span>}
      </div>

      <p className="target">{benefit.target}</p>

      {hasPriceInfo && (
        <div className="price-box">
          <p className="benefit-price">
            일반가 {benefit.originalPrice.toLocaleString()}원 · 학생가{" "}
            {benefit.studentPrice.toLocaleString()}원
          </p>
          <p className="benefit-save">{savedAmount.toLocaleString()}원 절약</p>
        </div>
      )}

      {benefit.studentPoint && (
        <p className="student-point">포인트 {benefit.studentPoint}</p>
      )}

      <p className="desc">
        {benefit.description.split("\n").map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </p>

      {benefit.groupBenefit && (
        <p className="group-benefit">{benefit.groupBenefit}</p>
      )}

      <div className="proof">
        {benefit.proof.map((proof) => (
          <span key={proof}>{proof}</span>
        ))}
      </div>

      {benefit.notes && <p className="notes">※ {benefit.notes}</p>}

      {hasDetailLinks && !isCategorySummary && isExpanded && (
        <div className="detail-card-list">
          {detailGroups.map((group) => (
            <div className="detail-card" key={group.title}>
              <h4>{group.title}</h4>
              <div className="detail-card-actions">
                {group.links.map((link) => (
                  <a
                    key={`${group.title}-${link.label}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasDetailLinks && isCategorySummary ? (
        <Link className="detail-btn" to={`/benefits/${benefit.id}`}>
          상세 혜택 카드 보기
        </Link>
      ) : hasDetailLinks ? (
        <button
          className="detail-btn"
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "접기" : "상세 혜택 카드 보기"}
        </button>
      ) : (
        <a
          href={benefit.link}
          className="detail-btn"
          target="_blank"
          rel="noreferrer"
        >
          자세히 보기
        </a>
      )}
    </div>
  );
}
