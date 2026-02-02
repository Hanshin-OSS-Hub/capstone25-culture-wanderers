import { useEffect, useMemo, useState } from "react";
import "./MyPartyPosts.css";

const POSTS_KEY = "mypage_party_posts";

function loadPosts() {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePosts(next) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(next));
}

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
  const [posts, setPosts] = useState([]);
  const [mode, setMode] = useState("list"); // list | create | edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // 최초 로드
  useEffect(() => {
    const stored = loadPosts();
    // 최신순 정렬(선택)
    const sorted = stored
      .slice()
      .sort((a, b) =>
        (b.updatedAt || b.createdAt || "").localeCompare(
          a.updatedAt || a.createdAt || ""
        )
      );
    setPosts(sorted);
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

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm({ ...emptyForm, date: formatDate() });
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

  const handleDelete = (id) => {
    if (!window.confirm("이 모집글을 삭제할까요?")) return;
    const next = posts.filter((p) => Number(p.id) !== Number(id));
    setPosts(next);
    savePosts(next);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) return "제목을 입력해주세요.";
    if (!form.region.trim()) return "지역을 입력해주세요.";
    if (!form.date.trim()) return "날짜를 입력해주세요.";
    if (!form.content.trim()) return "내용을 입력해주세요.";
    if (Number(form.모집인원) < 2) return "모집인원은 최소 2명 이상으로 해주세요.";
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    if (mode === "create") {
      const newPost = {
        id: Date.now(),
        title: form.title.trim(),
        region: form.region.trim(),
        date: form.date.trim(),
        capacity: Number(form.모집인원),
        contact: form.contact.trim(),
        content: form.content.trim(),
        createdAt: formatDate(),
      };

      const next = [newPost, ...posts];
      setPosts(next);
      savePosts(next);

      alert("모집글이 등록되었습니다!");
      resetToList();
      return;
    }

    if (mode === "edit") {
      const idx = posts.findIndex((p) => Number(p.id) === Number(editingId));
      if (idx === -1) {
        alert("수정할 글을 찾을 수 없습니다.");
        resetToList();
        return;
      }

      const updated = {
        ...posts[idx],
        title: form.title.trim(),
        region: form.region.trim(),
        date: form.date.trim(),
        capacity: Number(form.모집인원),
        contact: form.contact.trim(),
        content: form.content.trim(),
        updatedAt: formatDate(),
      };

      const next = posts.slice();
      next[idx] = updated;
      setPosts(next);
      savePosts(next);

      alert("모집글이 수정되었습니다!");
      resetToList();
    }
  };

  return (
    <div className="myposts-page">
      <div className="myposts-header">
        <h2>내 파티 모집글</h2>

        {mode === "list" ? (
          <button className="myposts-primary-btn" onClick={openCreate}>
            ✏️ 모집글 작성
          </button>
        ) : (
          <button className="myposts-ghost-btn" onClick={resetToList}>
            ← 목록으로
          </button>
        )}
      </div>

      {/* 작성/수정 폼 */}
      {mode !== "list" && (
        <section className="myposts-form-card">
          <h3 className="myposts-form-title">
            {isEditing ? "모집글 수정" : "모집글 작성"}
          </h3>

          {isEditing && editingPost && (
            <p className="myposts-form-sub">
              작성일: {editingPost.createdAt}
              {editingPost.updatedAt ? ` · 수정일: ${editingPost.updatedAt}` : ""}
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
                />
              </div>

              <div className="myposts-field">
                <label>지역</label>
                <input
                  value={form.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                  placeholder="예) 서울 / 홍대"
                />
              </div>

              <div className="myposts-field">
                <label>날짜</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>

              <div className="myposts-field">
                <label>모집 인원</label>
                <input
                  type="number"
                  min={2}
                  value={form.모집인원}
                  onChange={(e) => handleChange("모집인원", e.target.value)}
                />
              </div>

              <div className="myposts-field full">
                <label>연락 방법(선택)</label>
                <input
                  value={form.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  placeholder="예) 오픈채팅 링크 / 인스타 ID"
                />
              </div>

              <div className="myposts-field full">
                <label>내용</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  placeholder="어떤 분위기/조건인지 자세히 적어주세요."
                />
              </div>
            </div>

            <div className="myposts-actions">
              <button
                type="button"
                className="myposts-ghost-btn"
                onClick={resetToList}
              >
                취소
              </button>
              <button type="submit" className="myposts-primary-btn">
                {isEditing ? "저장" : "등록"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 목록 */}
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
                      <span className="badge">📍 {p.region}</span>
                      <span className="badge">📅 {p.date}</span>
                      <span className="badge">👥 {p.capacity}명</span>
                    </div>
                    <div className="myposts-dates">
                      <span>{p.updatedAt ? `${p.updatedAt} (수정)` : p.createdAt}</span>
                    </div>
                  </div>

                  <h3 className="myposts-card-title">{p.title}</h3>

                  <p className="myposts-card-content">{p.content}</p>

                  {p.contact ? (
                    <p className="myposts-contact">연락: {p.contact}</p>
                  ) : null}

                  <div className="myposts-card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEdit(p.id)}
                    >
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
