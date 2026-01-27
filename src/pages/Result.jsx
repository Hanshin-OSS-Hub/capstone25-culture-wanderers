import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Result() {
  const { search } = useLocation(); // "?region=서울&date=2026-02-01&category=축제"
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // URLSearchParams로 화면 상단 검색창에 기본값 채우기에도 사용 가능
  const params = new URLSearchParams(search);
  const region = params.get("region") || "전체";
  const date = params.get("date") || "";
  const category = params.get("category") || "전체";
  const q = params.get("q") || ""; // 키워드도 쓸 거면

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // ✅ 백엔드 검색 API 호출
        const res = await axios.get(`http://localhost:3000/api/festivals/search${search}`);
        setResults(res.data);
      } catch (e) {
        console.error("검색 결과 불러오기 실패:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [search]);

  // (선택) 결과 페이지에서도 다시 검색할 수 있게 상단에 검색창을 두고 싶으면
  const handleGoSearch = () => {
    const next = new URLSearchParams();
    if (region && region !== "전체") next.set("region", region);
    if (date) next.set("date", date);
    if (category && category !== "전체") next.set("category", category);
    if (q) next.set("q", q);
    navigate(`/result?${next.toString()}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>검색 결과</h2>
      <div style={{ marginBottom: 12, color: "#666" }}>
        조건: {region} / {date || "날짜없음"} / {category} {q ? `/ "${q}"` : ""}
      </div>

      {loading ? (
        <div>불러오는 중...</div>
      ) : results.length === 0 ? (
        <div>검색 결과가 없습니다.</div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>총 {results.length}개</div>

          <div className="festival-grid">
            {results.map((f) => (
              <div key={f.id} className="festival-card">
                <img
                  src={f.thumbnail_url}
                  alt={f.title}
                  style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div style={{ fontWeight: 700, marginTop: 8 }}>{f.title}</div>
                <div style={{ color: "#666", fontSize: 14 }}>{f.region}</div>
                <div style={{ color: "#666", fontSize: 14 }}>{f.location}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
