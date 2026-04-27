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
  if (Number.isNaN(date.getTime())) return String(value);

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
  if (Number.isNaN(date.getTime())) return String(value);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatConditionText(condition) {
  const raw = String(condition || "").trim();
  if (!raw) return "별도의 모집 조건 없음";
  if (raw.toUpperCase() === "GENERAL") return "별도의 모집 조건 없음";
  return raw;
}

function normalizeParty(party) {
  return {
    ...party,
    festivalTitle: party.festivalTitle || "",
    region: party.location || "",
    date: formatDateTimeForInput(party.meetingTime),
    capacity: party.maxPeople ?? 2,
    contact: party.contact || "",
    deadline: party.deadline || "",
    condition: formatConditionText(party.category),
  };
}

function getPartyStatusLabel(party) {
  const currentPeople = Number(party.currentPeople ?? 0);
  const maxPeople = Number(party.capacity ?? party.maxPeople ?? 0);
  const rawStatus = String(party.status || "").toUpperCase();
  const meetingTime = party.meetingTime ? new Date(party.meetingTime).getTime() : null;
  const deadlineTime = party.deadline ? new Date(party.deadline).getTime() : null;
  const now = Date.now();

  if (
    rawStatus === "CLOSED" ||
    (maxPeople > 0 && currentPeople >= maxPeople) ||
    (deadlineTime && !Number.isNaN(deadlineTime) && now > deadlineTime) ||
    (meetingTime && !Number.isNaN(meetingTime) && now > meetingTime)
  ) {
    return "모집 완료";
  }

  return "모집 중";
}

const emptyForm = {
  title: "",
  region: "",
  date: "",
  deadline: "",
  recruitCount: 2,
  contact: "",
  condition: "",
  content: "",
};

export default function MyPartyPosts() {
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [mode, setMode] = useState("list");
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
        const postList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

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
        console.error("파티 모집글 조회 실패:", err);
        setError("파티 모집글을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const isEditing = mode === "edit";

  const editingPost = useMemo(() => {
    if (!editingId) return null;
    return posts.find((post) => Number(post.id) === Number(editingId)) || null;
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
      deadline: preset?.deadline || "",
      recruitCount: preset?.recruitCount || 2,
      contact: preset?.contact || "",
      condition: preset?.condition || "",
    });
  };

  const openEdit = (id) => {
    const target = posts.find((post) => Number(post.id) === Number(id));
    if (!target) {
      alert("수정할 글을 찾을 수 없어요.");
      return;
    }

    setMode("edit");
    setEditingId(id);
    setForm({
      title: target.title || "",
      region: target.region || "",
      date: target.date || "",
      deadline: formatDateTimeForInput(target.deadline),
      recruitCount: target.capacity ?? 2,
      contact: target.contact || "",
      condition: target.condition === "별도의 모집 조건 없음" ? "" : target.condition || "",
      content: target.content || "",
    });
  };

  useEffect(() => {
    const partyTarget = location.state;
    if (!partyTarget?.fromFestival) return;

    openCreate({
      title: `${partyTarget.festivalTitle} 같이 가실 분?`,
      region: partyTarget.region || partyTarget.location || "",
      content: `${partyTarget.festivalTitle} 같이 갈 분 모집합니다.\n편하게 요청해주세요!`,
      date: `${formatDate()}T19:00`,
      recruitCount: 2,
    });

    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    const editPartyId = location.state?.editPartyId;
    if (!editPartyId || posts.length === 0) return;

    const target = posts.find((post) => Number(post.id) === Number(editPartyId));
    if (!target) return;

    openEdit(editPartyId);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, posts]);

  const handleDelete = async (id) => {
    if (!window.confirm("이 모집글을 삭제할까요?")) return;

    try {
      await authFetch(`/api/party-posts/${id}`, {
        method: "DELETE",
      });

      setPosts((prev) => prev.filter((post) => Number(post.id) !== Number(id)));
      alert("모집글을 삭제했어요.");
    } catch (err) {
      console.error("모집글 삭제 실패:", err);
      alert("모집글 삭제에 실패했어요.");
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
    if (Number(form.recruitCount) < 2) return "모집 인원은 최소 2명 이상으로 해주세요.";

    const meetingAt = new Date(form.date).getTime();
    if (!Number.isNaN(meetingAt) && meetingAt <= Date.now()) {
      return "모임 일시는 현재 시간보다 이후여야 해요.";
    }

    if (form.deadline.trim()) {
      const deadlineAt = new Date(form.deadline).getTime();
      if (!Number.isNaN(deadlineAt) && deadlineAt <= Date.now()) {
        return "모집 마감일은 현재 시간보다 이후여야 해요.";
      }
      if (!Number.isNaN(deadlineAt) && !Number.isNaN(meetingAt) && deadlineAt >= meetingAt) {
        return "모집 마감일은 모임 일시보다 빨라야 해요.";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const message = validate();
    if (message) {
      alert(message);
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      status: "RECRUITING",
      category: form.condition.trim() || "GENERAL",
      maxPeople: Number(form.recruitCount),
      currentPeople: isEditing ? editingPost?.currentPeople ?? 0 : 0,
      meetingTime: form.date,
      location: form.region.trim(),
      contact: form.contact.trim(),
      festivalId: location.state?.festivalId ?? editingPost?.festivalId ?? null,
      festivalTitle: location.state?.festivalTitle ?? editingPost?.festivalTitle ?? null,
      deadline: form.deadline.trim() || null,
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

        alert("모집글을 등록했어요.");
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
            .map((post) => (Number(post.id) === Number(editingId) ? { ...post, ...updatedPost } : post))
            .sort((a, b) =>
              String(b.updatedAt || b.createdAt || "").localeCompare(
                String(a.updatedAt || a.createdAt || "")
              )
            )
        );

        alert("모집글을 수정했어요.");
        resetToList();
      }
    } catch (err) {
      console.error("모집글 저장 실패:", err);
      alert("모집글 저장에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="myposts-page">파티 모집글을 불러오는 중이에요.</div>;
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
            새 모집글 작성
          </button>
        ) : (
          <button className="myposts-ghost-btn" onClick={resetToList}>
            목록으로
          </button>
        )}
      </div>

      {mode !== "list" && (
        <section className="myposts-form-card">
          <h3 className="myposts-form-title">{isEditing ? "모집글 수정" : "모집글 작성"}</h3>

          {isEditing && editingPost ? (
            <p className="myposts-form-sub">
              작성일 {formatCreatedAt(editingPost.createdAt)}
              {editingPost.updatedAt ? ` · 수정일 ${formatCreatedAt(editingPost.updatedAt)}` : ""}
            </p>
          ) : null}

          <form className="myposts-form" onSubmit={handleSubmit}>
            <div className="myposts-grid">
              <div className="myposts-field">
                <label>제목</label>
                <input
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="예) 같이 전시 보러 가실 분?"
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field">
                <label>지역</label>
                <input
                  value={form.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                  placeholder="예) 서울, 경기"
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
                  value={form.recruitCount}
                  onChange={(e) => handleChange("recruitCount", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field full">
                <label>모집 마감일</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field full">
                <label>모집 조건</label>
                <input
                  value={form.condition}
                  onChange={(e) => handleChange("condition", e.target.value)}
                  placeholder="예) 20대, 전시 좋아하시는 분"
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field full">
                <label>연락 방법</label>
                <input
                  value={form.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  placeholder="오픈채팅 링크, 인스타 ID, 이메일 등을 적어주세요."
                  disabled={isSubmitting}
                />
              </div>

              <div className="myposts-field full">
                <label>내용</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  placeholder="어떤 분위기의 모임인지, 함께 무엇을 할지 적어주세요."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="myposts-actions">
              <button type="button" className="myposts-ghost-btn" onClick={resetToList} disabled={isSubmitting}>
                취소
              </button>
              <button type="submit" className="myposts-primary-btn" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : isEditing ? "저장" : "등록"}
              </button>
            </div>
          </form>
        </section>
      )}

      {mode === "list" && (
        <>
          {posts.length === 0 ? (
            <p className="myposts-empty">아직 작성한 모집글이 없어요. 첫 모집글을 올려볼까요?</p>
          ) : (
            <div className="myposts-list">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="myposts-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/party/${post.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/party/${post.id}`);
                    }
                  }}
                >
                  <div className="myposts-card-top">
                    <div className="myposts-badges">
                      <span className="badge">지역: {post.region || "-"}</span>
                      <span className="badge">{formatDisplayDateTime(post.meetingTime || post.date)}</span>
                      <span className="badge">인원: {post.capacity ?? 2}명</span>
                      <span className="badge">상태: {getPartyStatusLabel(post)}</span>
                    </div>
                    <div className="myposts-dates">
                      <span>
                        {post.updatedAt
                          ? `${formatCreatedAt(post.updatedAt)} (수정)`
                          : formatCreatedAt(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {post.festivalTitle ? (
                    <div
                      className="myposts-festival"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post.festivalId) {
                          navigate(`/detail/${post.festivalId}`);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          if (post.festivalId) {
                            navigate(`/detail/${post.festivalId}`);
                          }
                        }
                      }}
                    >
                      관련 축제: {post.festivalTitle}
                    </div>
                  ) : null}

                  <h3 className="myposts-card-title">{post.title}</h3>
                  <p className="myposts-card-content">{post.content}</p>
                  {post.deadline ? (
                    <p className="myposts-contact">모집 마감일: {formatDisplayDateTime(post.deadline)}</p>
                  ) : null}
                  <p className="myposts-contact">모집 조건: {post.condition}</p>
                  {post.contact ? <p className="myposts-contact">연락: {post.contact}</p> : null}

                  <div className="myposts-card-actions">
                    <button
                      className="btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(post.id);
                      }}
                    >
                      수정
                    </button>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
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
