import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../api/authFetch";
import "./MyQuestions.css";

function formatDate(value) {
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

export default function MyQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", regionTag: "서울" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMyQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        let list = [];

        try {
          // 최신 백엔드 경로
          const data = await authFetch("/api/me/posts?type=QUESTION");
          list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];
        } catch (primaryError) {
          // 구버전 서버 폴백: /api/me + /api/posts 필터링
          const me = await authFetch("/api/me");
          const meEmail = me?.email || me?.data?.email || "";

          const allQuestions = await authFetch("/api/posts?type=QUESTION");
          const candidateList = Array.isArray(allQuestions)
            ? allQuestions
            : Array.isArray(allQuestions?.data)
              ? allQuestions.data
              : [];

          list = candidateList.filter(
            (item) => String(item?.userEmail || "").toLowerCase() === String(meEmail).toLowerCase()
          );

          if (!meEmail) {
            throw primaryError;
          }
        }

        setQuestions(list);
      } catch (err) {
        console.error("내 질문 조회 실패:", err);
        setError("내 질문 목록을 불러오지 못했습니다. 다시 로그인 후 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyQuestions();
  }, []);

  const editingQuestion = useMemo(() => {
    if (!editingId) return null;
    return questions.find((q) => Number(q.id) === Number(editingId)) || null;
  }, [editingId, questions]);

  const openEdit = (question) => {
    setEditingId(question.id);
    setForm({
      title: question.title || "",
      content: question.content || "",
      regionTag: question.regionTag || "서울",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", content: "", regionTag: "서울" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 질문을 삭제할까요?")) return;

    try {
      await authFetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      setQuestions((prev) => prev.filter((q) => Number(q.id) !== Number(id)));
      if (Number(editingId) === Number(id)) {
        cancelEdit();
      }
      alert("질문이 삭제되었습니다.");
    } catch (err) {
      console.error("질문 삭제 실패:", err);
      alert(err.message || "질문 삭제에 실패했습니다.");
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    if (!editingId) return;
    if (!form.title.trim() || !form.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await authFetch(`/api/posts/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          regionTag: form.regionTag || "서울",
        }),
      });

      setQuestions((prev) =>
        prev.map((q) => (Number(q.id) === Number(editingId) ? { ...q, ...updated } : q))
      );

      alert("질문이 수정되었습니다.");
      cancelEdit();
    } catch (err) {
      console.error("질문 수정 실패:", err);
      alert(err.message || "질문 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="myquestions-page">질문을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="myquestions-page">{error}</div>;
  }

  return (
    <div className="myquestions-page">
      <div className="myquestions-header">
        <h2>내 질문</h2>
      </div>

      {questions.length === 0 ? (
        <p className="myquestions-empty">아직 작성한 질문이 없습니다.</p>
      ) : (
        <div className="myquestions-list">
          {questions.map((q) => (
            <article
              key={q.id}
              className="myquestions-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/community/question/${q.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/community/question/${q.id}`);
                }
              }}
            >
              <div className="myquestions-meta">
                <span>📍 {q.regionTag || "일반"}</span>
                <span>👁 {q.viewCount ?? 0}</span>
                <span>{formatDate(q.createdAt)}</span>
              </div>

              <h3 className="myquestions-title">{q.title || "제목 없음"}</h3>
              <p className="myquestions-content">{q.content || "내용 없음"}</p>

              <div className="myquestions-actions">
                <button
                  className="btn-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(q);
                  }}
                >
                  수정
                </button>
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(q.id);
                  }}
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingQuestion && (
        <section className="myquestions-edit-card">
          <h3>질문 수정</h3>
          <form onSubmit={handleSubmitEdit} className="myquestions-form">
            <label>
              제목
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                disabled={isSubmitting}
              />
            </label>

            <label>
              내용
              <textarea
                rows={5}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                disabled={isSubmitting}
              />
            </label>

            <label>
              지역 태그
              <select
                value={form.regionTag}
                onChange={(e) => setForm((prev) => ({ ...prev, regionTag: e.target.value }))}
                disabled={isSubmitting}
              >
                <option>서울</option>
                <option>부산</option>
                <option>경기</option>
                <option>인천</option>
                <option>기타</option>
              </select>
            </label>

            <div className="myquestions-form-actions">
              <button type="button" className="btn-edit" onClick={cancelEdit} disabled={isSubmitting}>
                취소
              </button>
              <button type="submit" className="btn-save" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
