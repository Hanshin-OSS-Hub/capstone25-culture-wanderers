import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authFetch } from "../../api/authFetch";
import "./MyPartyPosts.css";

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTimeForInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    if (typeof value === "string") {
      return value.length >= 16 ? value.slice(0, 16) : value;
    }
    return "";
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatDisplayDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatCreatedAt(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeParty(p) {
  return {
    ...p,
    festivalTitle: p.festivalTitle || "",
    region: p.location || "",
    date: formatDateTimeForInput(p.meetingTime),
    capacity: p.maxPeople ?? 2,
    contact: p.contact || "",
  };
}

const emptyForm = {
  title: "",
  region: "",
  date: "",
  모집인원: 2,
  contact: "",
  content: "",
};

export default function MyPartyPosts() {
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [mode, setMode] = useState("list"); // list | create | edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await authFetch("/api/me/party-posts");

        const postList = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];

        const normalized = postList.map(normalizeParty);

        const sorted = normalized
          .slice()
          .sort((a, b) =>
            String(b.updatedAt || b.createdAt || "").localeCompare(
              String(a.updatedAt || a.createdAt || "")
            )
          );

        setPosts(sorted);
      } catch (err) {
        console.error("내 파티 모집글 조회 실패:", err);
        setError("내 파티 모집글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const isEditing = mode === "edit";

  const editingPost = useMemo(() => {
    if (!editingId) return null;
    return posts.find((p) => Number(p.id) === Number(editingId)) || null;
  }, [editingId, posts]);

  const resetToList = () => {
    setMode("list");
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = (preset = null) => {
    setMode("create");
    setEditingId(null);
    setForm({
      ...emptyForm,
      title: preset?.title || "",
      region: preset?.region || "",
      content: preset?.content || "",
      date: preset?.date || `${formatDate()}T19:00`,
      모집인원: preset?.모집인원 || 2,
      contact: preset?.contact || "",
    });
  };

  const openEdit = (id) => {
    const target = posts.find((p) => Number(p.id) === Number(id));
    if (!target) {
      alert("수정할 글을 찾을 수 없습니다.");
      return;
    }

    setMode("edit");
    setEditingId(id);
    setForm({
      title: target.title || "",
      region: target.region || "",
      date: target.date || "",
      모집인원: target.capacity ?? 2,
      contact: target.contact || "",
      content: target.content || "",
    });
  };

  useEffect(() => {
    const partyTarget = location.state;

    if (!partyTarget?.fromFestival) return;

    openCreate({
      title: `${partyTarget.festivalTitle} 같이 가실 분 구해요!`,
      region: partyTarget.region || partyTarget.location || "",
      content: `${partyTarget.festivalTitle} 같이 가실 분 모집합니다.\n편하게 신청해주세요!`,
      date: `${formatDate()}T19:00`,
      모집인원: 2,
    });

    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("이 모집글을 삭제할까요?")) return;

    try {
      await authFetch(`/api/party-posts/${id}`, {
        method: "DELETE",
      });

      setPosts((prev) => prev.filter((p) => Number(p.id) !== Number(id)));
      alert("모집글이 삭제되었습니다.");
    } catch (err) {
      console.error("모집글 삭제 실패:", err);
      alert("모집글 삭제에 실패했습니다.");
    }
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) return "제목을 입력해주세요.";
    if (!form.region.trim()) return "지역을 입력해주세요.";
    if (!form.date.trim()) return "모임 일시를 입력해주세요.";
    if (!form.content.trim()) return "내용을 입력해주세요.";
    if (Number(form.모집인원) < 2) return "모집인원은 최소 2명 이상으로 해주세요.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      status: "OPEN",
      category: "GENERAL",
      maxPeople: Number(form.모집인원),
      currentPeople: isEditing ? editingPost?.currentPeople ?? 0 : 0,
      meetingTime: form.date,
      location: form.region.trim(),
      festivalId: location.state?.festivalId ?? null,
      festivalTitle: location.state?.festivalTitle ?? null,
    };

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        const created = await authFetch("/api/party-posts", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const newPost = normalizeParty(
          created?.data ?? created ?? {
            ...payload,
            id: Date.now(),
            createdAt: new Date().toISOString(),
          }
        );

        setPosts((prev) =>
          [newPost, ...prev].sort((a, b) =>
            String(b.updatedAt || b.createdAt || "").localeCompare(
              String(a.updatedAt || a.createdAt || "")
            )
          )
        );

        alert("모집글이 등록되었습니다!");
        resetToList();
        return;
      }

      if (mode === "edit") {
        const updatedResponse = await authFetch(`/api/party-posts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        const updatedPost = normalizeParty(
          updatedResponse?.data ?? updatedResponse ?? {
            ...editingPost,
            ...payload,
            id: editingId,
            updatedAt: new Date().toISOString(),
          }
        );

        setPosts((prev) =>
          prev
            .map((p) =>
              Number(p.id) === Number(editingId) ? { ...p, ...updatedPost } : p
            )
            .sort((a, b) =>
              String(b.updatedAt || b.createdAt || "").localeCompare(
                String(a.updatedAt || a.createdAt || "")
              )
            )
        );

        alert("모집글이 수정되었습니다!");
        resetToList();
      }
    } catch (err) {
      console.error("모집글 저장 실패:", err);
      alert("모집글 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="myposts-page">내 파티 모집글을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="myposts-page">{error}</div>;
  }

  return (
    <div className="myposts-page">
      <div className="myposts-header">
        <h2>내 파티 모집글</h2>

        {mode === "list" ? (
          <button className="myposts-primary-btn" onClick={() => openCreate()}>
            ✏️ 모집글 작성
          </button>
        ) : (
          <button className="myposts-ghost-btn" onClick={resetToList}>
            ← 목록으로
          </button>
        )}
      </div>

      {mode !== "list" && (
        <section className="myposts-form-card">
          <h3 className="myposts-form-title">
            {isEditing ? "모집글 수정" : "모집글 작성"}
          </h3>

          {isEditing && editingPost && (
            <p className="myposts-form-sub">
              작성일: {formatCreatedAt(editingPost.createdAt)}
              {editingPost.updatedAt
                ? ` · 수정일: ${formatCreatedAt(editingPost.updatedAt)}`
                : ""}
            </p>
          )}

          <form className="myposts-form" onSubmit={handleSubmit}>
            <div className="myposts-grid">
              <div className="myposts-field">
                <label>제목</label>
                <input
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="예) 같이 홍대 축제 보러가요!"
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field">
                <label>지역</label>
                <input
                  value={form.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                  placeholder="예) 서울 / 홍대"
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field">
                <label>모임 일시</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field">
                <label>모집 인원</label>
                <input
                  type="number"
                  min={2}
                  value={form.모집인원}
                  onChange={(e) => handleChange("모집인원", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field full">
                <label>연락 방법(현재 저장 안 됨)</label>
                <input
                  value={form.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  placeholder="백엔드 필드 없어서 화면 입력만 됩니다."
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field full">
                <label>내용</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  placeholder="어떤 분위기/조건인지 자세히 적어주세요."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="myposts-actions">
              <button
                type="button"
                className="myposts-ghost-btn"
                onClick={resetToList}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="myposts-primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "저장 중..." : isEditing ? "저장" : "등록"}
              </button>
            </div>
          </form>
        </section>
      )}

      {mode === "list" && (
        <>
          {posts.length === 0 ? (
            <p className="myposts-empty">
              아직 작성한 모집글이 없습니다. 첫 모집글을 작성해보세요!
            </p>
          ) : (
            <div className="myposts-list">
              {posts.map((p) => (
                <article key={p.id} className="myposts-card">
                  <div className="myposts-card-top">
                    <div className="myposts-badges">
                      <span className="badge">📍 {p.region || "-"}</span>
                      <span className="badge">
                        📅 {formatDisplayDateTime(p.meetingTime || p.date)}
                      </span>
                      <span className="badge">👥 {p.capacity ?? 2}명</span>
                      <span className="badge">상태: {p.status || "OPEN"}</span>
                    </div>
                    <div className="myposts-dates">
                      <span>
                        {p.updatedAt
                          ? `${formatCreatedAt(p.updatedAt)} (수정)`
                          : formatCreatedAt(p.createdAt)}
                      </span>
                    </div>
                  </div>

                  {p.festivalTitle && (
                    <div className="myposts-festival">🎉 {p.festivalTitle}</div>
                  )}

                  <h3 className="myposts-card-title">{p.title}</h3>

                  <p className="myposts-card-content">{p.content}</p>

                  {p.contact ? (
                    <p className="myposts-contact">연락: {p.contact}</p>
                  ) : null}

                  <div className="myposts-card-actions">
                    <button className="btn-edit" onClick={() => openEdit(p.id)}>
                      수정
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(p.id)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}