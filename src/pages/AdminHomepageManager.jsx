import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminHomepageManager() {
  const [festivals, setFestivals] = useState([]);
  const [homepageInputs, setHomepageInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchMissingHomepages = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3000/api/admin/festivals/missing-homepage");
      setFestivals(res.data);

      const initialInputs = {};
      res.data.forEach((festival) => {
        initialInputs[festival.id] = festival.homepage_url || "";
      });
      setHomepageInputs(initialInputs);
    } catch (error) {
      console.error("홈페이지 누락 축제 조회 실패:", error);
      alert("홈페이지 누락 축제 목록을 불러오지 못했습니다.");
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissingHomepages();
  }, []);

  const handleChange = (id, value) => {
    setHomepageInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async (id) => {
    const homepage_url = homepageInputs[id]?.trim();

    if (!homepage_url) {
      alert("홈페이지 주소를 입력해주세요.");
      return;
    }

    try {
      setSavingId(id);

      await axios.put(`http://localhost:3000/api/admin/festivals/${id}/homepage`, {
        homepage_url,
      });

      alert("저장 완료");
      fetchMissingHomepages();
    } catch (error) {
      console.error("홈페이지 저장 실패:", error);
      alert("저장 실패");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>불러오는 중...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>공식 홈페이지 보완</h2>
      <p style={{ marginBottom: 20, color: "#666" }}>
        homepage_url이 비어 있는 축제만 표시됩니다.
      </p>

      {festivals.length === 0 ? (
        <div>보완할 축제가 없습니다.</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {festivals.map((festival) => (
            <div
              key={festival.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                background: "#fff",
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 700 }}>
                {festival.title}
              </div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>
                지역: {festival.region || "-"}
              </div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>
                장소: {festival.location || "-"}
              </div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                기간: {festival.start_date || "-"} ~ {festival.end_date || "-"}
              </div>

              <input
                type="text"
                placeholder="공식 홈페이지 URL 입력"
                value={homepageInputs[festival.id] || ""}
                onChange={(e) => handleChange(festival.id, e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginBottom: 10,
                }}
              />

              <button
                onClick={() => handleSave(festival.id)}
                disabled={savingId === festival.id}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#222",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {savingId === festival.id ? "저장 중..." : "저장"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}