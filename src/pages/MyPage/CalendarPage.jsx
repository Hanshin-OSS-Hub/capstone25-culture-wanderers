import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addCalendarEvent,
  getCalendarEvents,
  removeCalendarEvent,
} from "../../utils/calendarStorage";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const syncEvents = () => {
      setEvents(getCalendarEvents());
    };

    syncEvents();
    window.addEventListener("calendar-events-changed", syncEvents);
    window.addEventListener("storage", syncEvents);

    return () => {
      window.removeEventListener("calendar-events-changed", syncEvents);
      window.removeEventListener("storage", syncEvents);
    };
  }, []);

  const addEvent = (event) => {
    event.preventDefault();

    if (!date || !title.trim()) {
      alert("날짜와 제목을 입력해주세요.");
      return;
    }

    const result = addCalendarEvent({
      date,
      title: title.trim(),
      location: "",
      description: "",
    });

    if (!result.added) {
      alert("같은 일정이 이미 등록되어 있어요.");
      return;
    }

    setEvents(result.events);
    setDate("");
    setTitle("");
  };

  const handleRemoveEvent = (id) => {
    const ok = window.confirm("이 일정을 삭제할까요?");
    if (!ok) return;

    const next = removeCalendarEvent(id);
    setEvents(next);
  };

  const handleOpenEvent = (event) => {
    if (event?.festivalId) {
      navigate(`/detail/${event.festivalId}`);
      return;
    }

    if (event?.communityType && event?.communityId) {
      navigate(`/community/${event.communityType}/${event.communityId}`);
    }
  };

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">캘린더·일정</h2>

      <form onSubmit={addEvent} style={{ display: "flex", gap: 8 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="submit" style={btnStyle}>
          추가
        </button>
      </form>

      <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
        {events.length === 0 ? (
          <div style={{ padding: 16, color: "#6b7280" }}>등록된 일정이 없어요.</div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenEvent(ev)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenEvent(ev);
                }
              }}
              style={{
                border: "1px solid #f1e4ee",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                cursor:
                  ev?.festivalId || (ev?.communityType && ev?.communityId)
                    ? "pointer"
                    : "default",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{ev.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                  {ev.date}
                </div>

                {ev.location ? (
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    장소 {ev.location}
                  </div>
                ) : null}

                {ev.festivalPeriod ? (
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    행사 기간 {ev.festivalPeriod}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveEvent(ev.id);
                }}
                style={{
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid #f1e4ee",
                  background: "#fff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #f1e4ee",
  padding: "0 12px",
  outline: "none",
};

const btnStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #ffc3da",
  background: "#fff3f8",
  color: "#ff538b",
  cursor: "pointer",
  padding: "0 14px",
};
