import React from "react";
import "./SavedFestivalCard.css";

function formatDate(value) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw.split("T")[0];
}

export default function SavedFestivalCard({
  festival,
  onClick,
  showSavedBy = false,
  actionLabel = "",
  actionDisabled = false,
  onAction,
}) {
  const start = formatDate(festival.startDate || festival.start_date);
  const end = formatDate(festival.endDate || festival.end_date);
  const image = festival.thumbnailUrl || festival.thumbnail_url || "";

  const handleKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === " ") && typeof onClick === "function") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="saved-festival-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {image ? (
        <img src={image} alt={festival.title} className="saved-festival-image" />
      ) : (
        <div className="saved-festival-image placeholder" />
      )}

      <div className="saved-festival-info">
        <div className="saved-festival-title">{festival.title}</div>
        <div className="saved-festival-meta">
          {[start && end ? `${start} - ${end}` : start || end, festival.region, festival.location]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {showSavedBy && (festival.savedByNickname || festival.savedByEmail) ? (
          <div className="saved-festival-owner">
            {festival.savedByNickname || festival.savedByEmail}님이 저장
          </div>
        ) : null}
        {actionLabel && typeof onAction === "function" ? (
          <button
            type="button"
            className="saved-festival-action"
            disabled={actionDisabled}
            onClick={(event) => {
              event.stopPropagation();
              if (!actionDisabled) onAction();
            }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
