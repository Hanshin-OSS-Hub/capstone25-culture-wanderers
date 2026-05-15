import { useEffect, useState } from "react";

import {
  COMPANION_TEMPERATURE_GUIDE,
  getCompanionTrust,
} from "../utils/companionTrustStorage";
import "./UserTrustBadge.css";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function ratingText(score) {
  const value = Number(score || 0);
  if (value >= 5) return "매우 좋았어요";
  if (value >= 4) return "좋았어요";
  if (value >= 3) return "무난했어요";
  if (value >= 2) return "조금 아쉬웠어요";
  return "확인이 필요해요";
}

export default function UserTrustBadge({ email, compact = false }) {
  const [trust, setTrust] = useState(() => getCompanionTrust(email));
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("guide");

  useEffect(() => {
    const sync = () => setTrust(getCompanionTrust(email));

    sync();
    window.addEventListener("companion-trust-changed", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("companion-trust-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [email]);

  if (!email) return null;

  const ratings = Array.isArray(trust.ratings) ? trust.ratings : [];

  return (
    <>
      <button
        type="button"
        className={`user-trust-badge ${compact ? "compact" : ""}`}
        title={trust.label}
        aria-label="동행온도 보기"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        동행온도 {trust.score}℃
        {!compact && <span className="trust-label"> · {trust.label}</span>}
        {!compact && trust.count > 0 ? <span> · 동행평가 {trust.count}</span> : null}
      </button>

      {open && (
        <div
          className="trust-modal-backdrop"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="trust-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="trust-modal-header">
              <div>
                <div className="trust-modal-title">동행온도</div>
                <div className="trust-modal-subtitle">함께한 사람들의 평가로 천천히 올라가는 신뢰 지표예요.</div>
              </div>
              <button type="button" className="trust-modal-close" onClick={() => setOpen(false)} aria-label="닫기">
                ×
              </button>
            </div>

            <div className="trust-current">
              <strong>{trust.score}℃</strong>
              <span>{trust.label}</span>
              <small>{trust.count > 0 ? `평가 ${trust.count}개 · 평균 ${trust.average.toFixed(1)}점` : "아직 받은 평가가 없어요."}</small>
            </div>

            <div className="trust-tabs">
              <button
                type="button"
                className={activeTab === "guide" ? "active" : ""}
                onClick={() => setActiveTab("guide")}
              >
                온도 기준
              </button>
              <button
                type="button"
                className={activeTab === "reviews" ? "active" : ""}
                onClick={() => setActiveTab("reviews")}
              >
                받은 평가
              </button>
            </div>

            {activeTab === "guide" ? (
              <div className="trust-guide-list">
                {COMPANION_TEMPERATURE_GUIDE.map((item) => (
                  <div key={item.range} className="trust-guide-item">
                    <div className="trust-guide-range">{item.range}</div>
                    <div>
                      <div className="trust-guide-label">{item.label}</div>
                      <div className="trust-guide-desc">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="trust-review-list">
                {ratings.length === 0 ? (
                  <div className="trust-review-empty">아직 받은 동행 평가가 없어요.</div>
                ) : (
                  ratings.map((rating) => (
                    <div key={rating.id} className="trust-review-item">
                      <div className="trust-review-top">
                        <strong>{ratingText(rating.score)}</strong>
                        <span>{Number(rating.score || 0).toFixed(1)}점</span>
                      </div>
                      <div className="trust-review-meta">
                        {formatDate(rating.createdAt)}
                        {rating.fromEmail ? ` · ${rating.fromEmail}` : ""}
                      </div>
                      {rating.memo ? <p>{rating.memo}</p> : <p className="muted">남긴 메모가 없어요.</p>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
