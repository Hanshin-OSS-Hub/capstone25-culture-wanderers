import React, { useMemo, useState } from "react";

export default function UniversityAutocomplete({
  value = "",
  onChange,
  list = [], // ✅ 핵심: 기본값
  placeholder = "학교명을 입력하세요 (예: 한)",
}) {
  const [open, setOpen] = useState(false);

  const safeList = Array.isArray(list) ? list : []; // ✅ 방어

  const filtered = useMemo(() => {
    const q = (value || "").trim();
    if (!q) return safeList.slice(0, 20); // ✅ safeList 사용

    const starts = [];
    const includes = [];

    for (const name of safeList) {
      if (name.startsWith(q)) starts.push(name);
      else if (name.includes(q)) includes.push(name);
    }
    return [...starts, ...includes].slice(0, 30);
  }, [value, safeList]);

  return (
    <div className="uni-wrap">
      <input
        className="login-input"
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange?.(e.target.value); // ✅ onChange도 방어
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />

      {open && (
        <div className="uni-dropdown" onMouseDown={(e) => e.preventDefault()}>
          {filtered.length === 0 ? (
            <div className="uni-item empty">검색 결과가 없습니다.</div>
          ) : (
            filtered.map((name) => (
              <button
                key={name}
                type="button"
                className="uni-item"
                onClick={() => {
                  onChange?.(name);
                  setOpen(false);
                }}
              >
                {name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
