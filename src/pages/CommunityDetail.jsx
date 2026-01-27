// src/pages/CommunityDetail.jsx
import { Link, useParams } from "react-router-dom";
import "./Community.css";

// 임시 더미 데이터 (백엔드 붙기 전까지)
const dummyQuestion = {
  id: 1,
  title: "홍대 거리 축제 드레스코드가 어떻게 되나요?",
  category: "축제 / 홍대 · 드레스코드",
  author: "축제러버",
  time: "2시간 전",
  views: 123,
  likes: 10,
  body: `다음 주에 홍대 거리 축제에 처음 가보는데, 특별한 드레스코드가 있는지 궁금해요.
편한 옷 입고 가도 될까요? 아니면 어느 정도 꾸미고 가는 분위기인가요?`,
};

const dummyComments = [
  {
    id: 1,
    author: "축제러버",
    time: "1시간 전",
    body: "저도 궁금했는데 덕분에 같이 정보 얻고 가요!",
  },
  {
    id: 2,
    author: "홍대주민",
    time: "30분 전",
    body: "다양하게 입고 오는데, 편한 캐주얼에 포인트 하나 정도 주면 좋아요 :)",
  },
  {
    id: 3,
    author: "분위기꾼",
    time: "10분 전",
    body: "사진 많이 찍을 거면 사진 잘 받는 색깔 추천합니다!",
  },
];

export default function CommunityDetail() {
  const { id } = useParams();
  // 실제로는 id 이용해서 데이터 불러오면 됨
  const q = dummyQuestion;

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
          <h2 className="comment-title">댓글 {dummyComments.length}개</h2>

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
            {dummyComments.map((c) => (
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
