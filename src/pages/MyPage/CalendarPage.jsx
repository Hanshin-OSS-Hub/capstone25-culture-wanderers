// src/pages/MyPage/CalendarPage.jsx
import React, { useState } from "react";

//  프론트 완성용 더미 일정
const initialEvents = [
  { id: 1, date: "2026-03-21", title: "벚꽃 축제(더미)" },
  { id: 2, date: "2026-04-02", title: "재즈 페스티벌(더미)" },
];

export default function CalendarPage() {
  const [events, setEvents] = useState(initialEvents);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");

  const addEvent = (e) => {
    e.preventDefault();
    if (!date || !title.trim()) {
      alert("날짜와 제목을 입력해주세요.");
      return;
    }
    setEvents((prev) => [
      { id: Date.now(), date, title: title.trim() },
      ...prev,
    ]);
    setDate("");
    setTitle("");
  };

  const removeEvent = (id) => {
    const ok = window.confirm("이 일정을 삭제할까요?");
    if (!ok) return;
    setEvents((prev) => prev.filter((x) => x.id !== id));
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
          <div style={{ padding: 16, color: "#6b7280" }}>
            등록된 일정이 없어요.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              style={{
                border: "1px solid #f1e4ee",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{ev.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                  {ev.date}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeEvent(ev.id)}
                style={{
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid #f1e4ee",
                  background: "#fff",
                  cursor: "pointer",
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
