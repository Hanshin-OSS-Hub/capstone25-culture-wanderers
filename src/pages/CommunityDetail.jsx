// src/pages/CommunityDetail.jsx
import { Link, useParams } from "react-router-dom";
import "./Community.css";

export default function CommunityDetail() {
  const { id } = useParams();

  // 실제 데이터 연동 전: 더미 제거 후 null 처리
  const q = null;
  const comments = [];

  if (!q) {
    return (
      <div className="page community-detail-page">
        <div className="community-detail-inner">
          <div className="detail-top-row">
            <div className="detail-breadcrumb">
              <Link to="/community" className="detail-breadcrumb-link">
                커뮤니티
              </Link>
              <span className="detail-breadcrumb-sep">›</span>
              <span>상세</span>
            </div>
            <Link to="/community" className="detail-back-link">
              목록으로 돌아가기
            </Link>
          </div>

          <article className="question-card">
            <header className="question-header">
              <div className="question-category">게시글 없음</div>
              <h1 className="question-title">게시글 정보를 불러올 수 없습니다.</h1>

              <div className="question-meta">
                <span>삭제되었거나 아직 상세 조회 기능이 연결되지 않았습니다.</span>
              </div>
            </header>

            <div className="question-body">
              <p>커뮤니티 상세 데이터가 아직 준비되지 않았습니다.</p>
            </div>

            <div className="question-actions">
              <Link to="/community" className="btn-outline">
                목록으로 돌아가기
              </Link>
            </div>
          </article>

          <section className="comment-section">
            <h2 className="comment-title">댓글 0개</h2>

            <div className="comment-write-card">
              <textarea
                rows={3}
                placeholder="댓글 기능은 추후 연결 예정입니다."
                disabled
              />
              <div className="comment-write-footer">
                <span className="comment-hint">
                  댓글 데이터가 없습니다.
                </span>
                <button type="button" className="btn-primary-sm" disabled>
                  등록
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page community-detail-page">
      <div className="community-detail-inner">
        {/* 상단 카테고리/뒤로가기 */}
        <div className="detail-top-row">
          <div className="detail-breadcrumb">
            <Link to="/community" className="detail-breadcrumb-link">
              질문 게시판
            </Link>
            <span className="detail-breadcrumb-sep">›</span>
            <span>질문 상세</span>
          </div>
          <Link to="/community" className="detail-back-link">
            목록으로 돌아가기
          </Link>
        </div>

        {/* 질문 카드 */}
        <article className="question-card">
          <header className="question-header">
            <div className="question-category">{q.category}</div>
            <h1 className="question-title">{q.title}</h1>

            <div className="question-meta">
              <span className="meta-author">{q.author}</span>
              <span className="meta-dot">·</span>
              <span>{q.time}</span>
              <span className="meta-dot">·</span>
              <span>조회 {q.views}</span>
              <span className="meta-dot">·</span>
              <span>공감 {q.likes}</span>
            </div>
          </header>

          <div className="question-body">
            {q.body.split("\n").map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          <div className="question-actions">
            <button type="button" className="btn-outline">
              공감하기
            </button>
            <button type="button" className="btn-outline">
              스크랩
            </button>
            <button type="button" className="btn-outline">
              나도 글쓰기
            </button>
          </div>
        </article>

        {/* 댓글 영역 */}
        <section className="comment-section">
          <h2 className="comment-title">댓글 {comments.length}개</h2>

          <div className="comment-write-card">
            <textarea
              rows={3}
              placeholder="축제 후기를 공유하거나 의견을 남겨주세요."
            />
            <div className="comment-write-footer">
              <span className="comment-hint">
                로그인한 사용자만 댓글을 남길 수 있어요.
              </span>
              <button type="button" className="btn-primary-sm">
                등록
              </button>
            </div>
          </div>

          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  <span className="comment-time">{c.time}</span>
                </div>
                <p className="comment-body">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}