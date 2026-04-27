import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../api/authFetch";
import "./Community.css";

export default function CommunityWrite() {
  const { type } = useParams(); // question | review | free
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("review"); // 기본 탭
  const [rating, setRating] = useState(0);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [questionRegion, setQuestionRegion] = useState("서울");
  const [reviewTargetTitle, setReviewTargetTitle] = useState("");
  const [reviewCategory, setReviewCategory] = useState("축제");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [freeTitle, setFreeTitle] = useState("");
  const [freeContent, setFreeContent] = useState("");
  const [freeRegion, setFreeRegion] = useState("서울");
  const [submitting, setSubmitting] = useState(false);

  // URL 파라미터에 따라 탭 초기값 설정
  useEffect(() => {
    if (type === "question" || type === "review" || type === "free") {
      setActiveTab(type);
    }
  }, [type]);

  const handleTab = (tab) => {
    setActiveTab(tab);
    navigate(`/community/write/${tab}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFreeSubmit = async () => {
    if (!freeTitle.trim() || !freeContent.trim()) {
      alert("자유글 제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await authFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          type: "FREE",
          title: freeTitle.trim(),
          content: freeContent.trim(),
          regionTag: freeRegion,
        }),
      });

      alert("자유글이 등록되었습니다.");
      navigate("/community?tab=free");
    } catch (e) {
      console.error("자유글 등록 실패:", e);
      alert(e.message || "자유글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!questionTitle.trim() || !questionContent.trim()) {
      alert("질문 제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await authFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          type: "QUESTION",
          title: questionTitle.trim(),
          content: questionContent.trim(),
          regionTag: questionRegion,
        }),
      });

      alert("질문이 등록되었습니다.");
      navigate("/community?tab=question");
    } catch (e) {
      console.error("질문 등록 실패:", e);
      alert(e.message || "질문 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewTargetTitle.trim() || !reviewTitle.trim() || !reviewContent.trim() || !rating) {
      alert("리뷰 대상, 제목, 내용, 평점을 모두 입력해주세요.");
      return;
    }

    const targetTypeMap = {
      축제: "festival",
      공연: "party",
      전시: "artgallery",
      기타: "festival",
    };

    try {
      setSubmitting(true);
      await authFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          targetType: targetTypeMap[reviewCategory] || "festival",
          targetTitle: reviewTargetTitle.trim(),
          title: reviewTitle.trim(),
          content: reviewContent.trim(),
          rating,
        }),
      });

      alert("리뷰가 등록되었습니다.");
      navigate("/community?tab=review");
    } catch (e) {
      console.error("리뷰 등록 실패:", e);
      alert(e.message || "리뷰 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionForm = () => (
    <>
      <h1 className="cm-write-title">질문 작성하기</h1>
      <div className="cm-write-card">
        <div className="cm-write-row">
          <label className="cm-write-label">
            제목 <span className="cm-required">*</span>
          </label>
          <input
            className="cm-input"
            placeholder="축제 관련 궁금한 내용을 한 줄로 적어주세요"
            value={questionTitle}
            onChange={(e) => setQuestionTitle(e.target.value)}
          />
        </div>

        <div className="cm-write-row">
          <label className="cm-write-label">
            내용 <span className="cm-required">*</span>
          </label>
          <textarea
            className="cm-textarea"
            placeholder="궁금한 점을 자세히 적어주시면 더 도움이 되는 답변을 받을 수 있어요."
            value={questionContent}
            onChange={(e) => setQuestionContent(e.target.value)}
          />
        </div>

        <div className="cm-write-row cm-write-row-tags">
          <label className="cm-write-label">지역 태그</label>
          <div className="cm-tag-row">
            <select className="cm-select" value={questionRegion} onChange={(e) => setQuestionRegion(e.target.value)}>
              <option>서울</option>
              <option>부산</option>
              <option>경기</option>
              <option>인천</option>
              <option>기타</option>
            </select>
          </div>
        </div>

        <div className="cm-write-row">
          <label className="cm-write-label">이미지 첨부 (선택)</label>
          <div className="cm-upload-box">
            <div className="cm-upload-arrow">⬆</div>
            <div className="cm-upload-text">클릭하여 이미지 업로드</div>
            <div className="cm-upload-sub">최대 5MB</div>
          </div>
        </div>

        <div className="cm-write-actions">
          <button
            type="button"
            className="cm-btn-secondary"
            onClick={() => navigate("/community")}
          >
            취소
          </button>
          <button type="button" className="cm-btn-primary" onClick={handleQuestionSubmit} disabled={submitting}>
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </>
  );

  const renderReviewForm = () => (
    <>
      <h1 className="cm-write-title">리뷰 작성하기</h1>

      <div className="cm-write-card">
        {/* 행사 선택 */}
        <div className="cm-write-row">
          <label className="cm-write-label">
            행사 선택 <span className="cm-required">*</span>
          </label>
          <input
            className="cm-input"
            placeholder="행사 이름을 검색하거나 입력해주세요"
            value={reviewTargetTitle}
            onChange={(e) => setReviewTargetTitle(e.target.value)}
          />
        </div>

        {/* 카테고리 */}
        <div className="cm-write-row">
          <label className="cm-write-label">
            카테고리 <span className="cm-required">*</span>
          </label>
          <select className="cm-select" value={reviewCategory} onChange={(e) => setReviewCategory(e.target.value)}>
            <option>축제</option>
            <option>공연</option>
            <option>전시</option>
            <option>기타</option>
          </select>
        </div>

        {/* 별점 */}
        <div className="cm-write-row">
          <label className="cm-write-label">
            평점 <span className="cm-required">*</span>
          </label>
          <div className="cm-rating-wrap">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={
                  star <= rating ? "cm-rating-star active" : "cm-rating-star"
                }
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* 사진 업로드 */}
        <div className="cm-write-row">
          <label className="cm-write-label">
            사진 업로드 (최소 1장) <span className="cm-required">*</span>
          </label>
          <div className="cm-upload-box large">
            <div className="cm-upload-arrow">⬆</div>
            <div className="cm-upload-text">클릭하여 이미지 업로드</div>
            <div className="cm-upload-sub">최대 10MB, JPG/PNG</div>
          </div>
        </div>

        {/* 한 줄 후기 */}
        <div className="cm-write-row">
          <label className="cm-write-label">
            한 줄 후기 <span className="cm-required">*</span>
          </label>
          <input
            className="cm-input"
            placeholder="행사를 한 줄로 표현해보세요"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
          />
          <div className="cm-length-helper">{reviewTitle.length} / 50</div>
        </div>

        {/* 상세 후기 */}
        <div className="cm-write-row">
          <label className="cm-write-label">
            상세 후기 <span className="cm-required">*</span>
          </label>
          <textarea
            className="cm-textarea tall"
            placeholder="행사에 대한 솔직한 후기를 자유롭게 적어주세요. (최소 50자)"
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
          />
          <div className="cm-length-helper">{reviewContent.length} / 최소 50자</div>
        </div>

        {/* 작성 가이드 */}
        <div className="cm-guide-box">
          <div className="cm-guide-title">리뷰 작성 가이드</div>
          <ul className="cm-guide-list">
            <li>사진은 최소 1장 이상 첨부해주세요.</li>
            <li>후기는 최소 50자 이상 작성해주세요.</li>
            <li>욕설이나 비방은 삭제될 수 있어요.</li>
            <li>작성한 후기는 내 평가/리뷰 설정에서 수정 가능합니다.</li>
          </ul>
        </div>

        <div className="cm-write-actions">
          <button
            type="button"
            className="cm-btn-secondary"
            onClick={() => navigate("/community")}
          >
            취소
          </button>
          <button type="button" className="cm-btn-primary" onClick={handleReviewSubmit} disabled={submitting}>
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </>
  );

  const renderFreeForm = () => (
    <>
      <h1 className="cm-write-title">자유글 작성하기</h1>
      <div className="cm-write-card">
        <div className="cm-write-row">
          <label className="cm-write-label">
            제목 <span className="cm-required">*</span>
          </label>
          <input
            className="cm-input"
            placeholder="자유롭게 공유할 주제를 적어주세요"
            value={freeTitle}
            onChange={(e) => setFreeTitle(e.target.value)}
          />
        </div>

        <div className="cm-write-row">
          <label className="cm-write-label">
            내용 <span className="cm-required">*</span>
          </label>
          <textarea
            className="cm-textarea"
            placeholder="경험, 팁, 추천 코스 등을 자유롭게 작성해주세요."
            value={freeContent}
            onChange={(e) => setFreeContent(e.target.value)}
          />
        </div>

        <div className="cm-write-row cm-write-row-tags">
          <label className="cm-write-label">지역 태그</label>
          <div className="cm-tag-row">
            <select className="cm-select" value={freeRegion} onChange={(e) => setFreeRegion(e.target.value)}>
              <option>서울</option>
              <option>부산</option>
              <option>경기</option>
              <option>인천</option>
              <option>기타</option>
            </select>
          </div>
        </div>

        <div className="cm-write-actions">
          <button
            type="button"
            className="cm-btn-secondary"
            onClick={() => navigate("/community")}
          >
            취소
          </button>
          <button type="button" className="cm-btn-primary" onClick={handleFreeSubmit} disabled={submitting}>
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="community-write-page">
      <button
        type="button"
        className="cm-back-link"
        onClick={() => navigate("/community")}
      >
        ← 커뮤니티로 돌아가기
      </button>

      {/* 탭: 질문 / 리뷰 */}
      <div className="cm-write-tab-row">
        <button
          type="button"
          className={
            activeTab === "question" ? "cm-write-tab active" : "cm-write-tab"
          }
          onClick={() => handleTab("question")}
        >
          질문 게시판
        </button>
        <button
          type="button"
          className={
            activeTab === "review" ? "cm-write-tab active" : "cm-write-tab"
          }
          onClick={() => handleTab("review")}
        >
          리뷰 게시판
        </button>
        <button
          type="button"
          className={
            activeTab === "free" ? "cm-write-tab active" : "cm-write-tab"
          }
          onClick={() => handleTab("free")}
        >
          자유게시판
        </button>
      </div>

      {/* 선택된 탭에 따라 폼 렌더링 */}
      {activeTab === "question"
        ? renderQuestionForm()
        : activeTab === "review"
        ? renderReviewForm()
        : renderFreeForm()}
    </div>
  );
}
