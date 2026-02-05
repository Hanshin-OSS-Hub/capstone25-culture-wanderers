import "./BenefitCard.css";

export default function BenefitCard({ benefit }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{benefit.name}</h3>
        {benefit.isFree && <span className="badge">무료</span>}
      </div>

      <p className="target">{benefit.target}</p>

      <p className="desc">
        {benefit.description.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </p>

      <div className="proof">
        {benefit.proof.map((p) => (
          <span key={p}>{p}</span>
        ))}
      </div>

      {benefit.notes && <p className="notes">※ {benefit.notes}</p>}

      <a href={benefit.link} className="detail-btn">
        자세히 보기
      </a>
    </div>
  );
}
