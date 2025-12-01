// src/pages/CommunityDetail.jsx
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./Community.css";

export default function CommunityDetail() {
  const { type, id } = useParams(); // type: "question" | "review"
  const navigate = useNavigate();

  const isQuestion = type === "question";

  // 실제로는 id, type으로 API 요청해서 데이터 받아오면 됨
  const dummy = {
    title: isQuestion
      ? "홍대 거리 축제 드레스코드가 어떻게 되나요?"
      : "서울 한밤 페스티벌 다녀왔어요 (사진 많음)",
    content: isQuestion
      ? "다음 주에 홍대 거리 축제에 처음 가보는데, 특별한 드레스코드가 있는지 궁금해요. 편한 옷 입고 가도 될까요?"
      : "야경이 진짜 예뻤고, 무대 구성이 생각보다 알찼어요. 다만 입장 대기가 조금 긴 편이라 여유 있게 가는 걸 추천합니다!",
    tag: isQuestion ? "서울/홍대 · 드레스코드" : "서울 · 축제후기",
    time: "2시간 전",
    views: 123,
    likes: 10,
    comments: 3,
  };

  return (
    <div className="community-detail-page">
      <div className="community-write-header">
        <div className="community-breadcrumb">
          <button
            className="community-back-link"
            onClick={() => navigate(-1)}
          >
            ← 목록으로 돌아가기
          </button>
        </div>
      </div>

      <article className="community-detail-card">
        <header className="community-detail-header">
          <span className="community-detail-badge">
            {isQuestion ? "질문" : "리뷰"}
          </span>
          <h1 className="community-detail-title">{dummy.title}</h1>
          <div className="community-detail-meta">
            <span>{dummy.tag}</span>
            <span>{dummy.time}</span>
            <span>조회 {dummy.views}</span>
            <span>좋아요 {dummy.likes}</span>
          </div>
        </header>

        <section className="community-detail-body">
          <p>{dummy.content}</p>
        </section>

        <footer className="community-detail-footer">
          <button className="btn-ghost">좋아요</button>
          <button className="btn-ghost">스크랩</button>
          <Link to={`/community/write/${type}`} className="btn-ghost">
            나도 글쓰기
          </Link>
        </footer>
      </article>

      {/* 간단 댓글 영역 (UI만) */}
      <section className="community-comments">
        <h2 className="comments-title">댓글 {dummy.comments}개</h2>
        <div className="comment-input-row">
          <input
            className="community-input"
            placeholder="댓글을 입력해주세요"
          />
          <button className="btn-primary small">등록</button>
        </div>
        <ul className="comment-list">
          <li className="comment-item">
            <div className="comment-author">축제러버</div>
            <div className="comment-text">
              저도 궁금했는데 덕분에 같이 정보 얻고 가요!
            </div>
            <div className="comment-meta">1시간 전</div>
          </li>
        </ul>
      </section>
    </div>
  );
}
