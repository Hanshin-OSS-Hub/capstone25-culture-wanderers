import "./BenefitCard.css";

export default function BenefitCard({ benefit }) {
  const hasPriceInfo =
    typeof benefit.originalPrice === "number" &&
    typeof benefit.studentPrice === "number";

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
            일반가 {benefit.originalPrice.toLocaleString()}원 → 학생가 {benefit.studentPrice.toLocaleString()}원
          </p>
          <p className="benefit-save">{savedAmount.toLocaleString()}원 절약</p>
        </div>
      )}

      {benefit.studentPoint && (
        <p className="student-point">🎓 {benefit.studentPoint}</p>
      )}

      <p className="desc">
        {benefit.description.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </p>

      {benefit.groupBenefit && (
        <p className="group-benefit">👥 {benefit.groupBenefit}</p>
      )}

      <div className="proof">
        {benefit.proof.map((p) => (
          <span key={p}>{p}</span>
        ))}
      </div>

      {benefit.notes && <p className="notes">※ {benefit.notes}</p>}

      <a href={benefit.link} className="detail-btn" target="_blank" rel="noreferrer">
        자세히 보기
      </a>
    </div>
  );
}