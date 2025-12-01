import SearchPanel from '../components/SearchPanel.jsx'
import FestivalCard from '../components/FestivalCard.jsx'
import { Link } from "react-router-dom";

const festivals = [
    {
        id: 1,
        title: '서울 빛초롱 축제',
        period: '12.12 - 01.04',
        place: '청계천 일대',
        badge: '인기',
        reviews: 42,
    },
    {
        id: 2,
        title: '구리 빛 축제',
        period: '10.18 - 12.25',
        place: '구리 한강시민공원 일원',
        badge: '인기',
        reviews: 87,
    },
    {
        id: 3,
        title: 'K-푸드 페스티벌 넉넉',
        period: '06.20 - 12.31',
        place: '서울광장',
        badge: '인기',
        reviews: 23,
    },
    {
        id: 4,
        title: '서울무용제',
        period: '11.21 - 12.07',
        place: '아르코예술극장 대극장',
        badge: '인기 · 학생할인',
        reviews: 156,
    },
    ]

    // 학생 할인 카드용 더미 데이터
    const studentDeals = [
    {
        id: 1,
        title: '서울청년문화패스',
        desc: '서울 거주 19~24세 청년 대상 문화공연 최대 1만원 지원',
        target: '만 19~24세 서울 청년',
        benefit: '월 2회, 공연·전시 할인',
    },
    {
        id: 2,
        title: '국립박물관 대학생 무료입장',
        desc: '학생증만 있으면 주요 상설 전시 무료 관람',
        target: '대학생(재학 증명)',
        benefit: '국립중앙/현대미술관 등',
    },
    {
        id: 3,
        title: '경기문화재단 청년문화예술카드',
        desc: '경기도 거주 청년 대상 연간 문화포인트 지원',
        target: '만 19~34세 경기도 청년',
        benefit: '영화·전시·공연 결제 가능',
    },
    ]

    // 파티 모집 더미 데이터
    const partyList = [
    {
        id: 1,
        title: '서울 빛초롱 축제 같이 보러 갈 사람 구해요!',
        date: '11.30 (토) 18:00',
        place: '청계천',
        comments: 5,
        members: '3/5명',
        dday: 'D-3',
    },
    {
        id: 2,
        title: '부산 불꽃 축제 함께 즐길 분',
        date: '12.03 (화) 19:30',
        place: '광안리 해변',
        comments: 12,
        members: '2/4명',
        dday: 'D-6',
    },
    {
        id: 3,
        title: '현대미술 전시 관람 후 카페 가요~',
        date: '12.05 (목) 15:00',
        place: '국립현대미술관 서울관',
        comments: 3,
        members: '4/6명',
        dday: 'D-8',
    },
    ]

    // 커뮤니티 질문 / 리뷰 더미
    const questions = [
    {
        id: 1,
        title: '한번 축제비용 적당히 어느 정도가 좋을까요?',
        tag: '축제예산',
        time: '2시간 전',
        views: 128,
    },
    {
        id: 2,
        title: '부산 불꽃 축제날 예약 팁 있을까요?',
        tag: '부산',
        time: '어제',
        views: 523,
    },
    {
        id: 3,
        title: '전시회 사진 촬영 가능한가요?',
        tag: '전시예절',
        time: '3일 전',
        views: 159,
    },
    ]

    const reviews = [
    {
        id: 1,
        title: '서울 한밤 페스티벌 다녀왔어요 (사진 많음)',
        place: '서울',
        rating: 4.5,
        likes: 29,
        comments: 6,
    },
    {
        id: 2,
        title: '락페스티벌 생존 팁 정리',
        place: '인천',
        rating: 5.0,
        likes: 40,
        comments: 18,
    },
    {
        id: 3,
        title: '푸드 페스티벌 먹방 투어 후기',
        place: '경기',
        rating: 4.0,
        likes: 19,
        comments: 10,
    },
    ]

    export default function Home() {
  return (
    <>
      {/* 위쪽 핑크 히어로 */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">이번 주, 누구랑 어디 갈까?</h1>
          <p className="hero-subtitle">
            지역 축제 · 전시 · 공연을 찾고, 같이 갈 파티원까지 한 번에
          </p>

          <SearchPanel />
        </div>
      </section>

      {/* 이번 주 인기 축제 */}
      <section className="section section-popular">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🔥</span>
            <span>이번 주 인기 축제</span>
          </div>

          {/* 🔗 축제 탐색 페이지로 이동 */}
          <Link to="/search" className="link-button">
            전체보기 →
          </Link>
        </div>

        <div className="card-row">
          {festivals.map((f) => (
            <FestivalCard key={f.id} festival={f} />
          ))}
        </div>
      </section>

      {/* 학생 할인 모아보기 */}
      <section className="section section-student">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🎓</span>
            <span>학생 할인 모아보기</span>
          </div>

          {/* 🔗 혜택 전체 페이지(예: /benefits)로 이동 */}
          <Link to="/benefits" className="link-button">
            전체보기 →
          </Link>
        </div>

        <div className="student-row">
          {studentDeals.map((item) => (
            <div key={item.id} className="student-card">
              <div className="student-tag">학생 할인</div>
              <h3 className="student-title">{item.title}</h3>
              <p className="student-desc">{item.desc}</p>
              <div className="student-meta">
                <span>대상: {item.target}</span>
                <span>혜택: {item.benefit}</span>
              </div>
              <button className="student-link">자세히 보기 →</button>
            </div>
          ))}
        </div>
      </section>

      {/* 지금 모집 중인 파티 */}
      <section className="section section-parties">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">👥</span>
            <span>지금 모집 중인 파티</span>
          </div>

          {/* 🔗 파티 목록 페이지로 이동 */}
          <Link to="/party" className="link-button">
            전체보기 →
          </Link>
        </div>

        <div className="party-list">
          {partyList.map((p) => (
            <div key={p.id} className="party-item">
              <div className="party-main">
                <h3 className="party-title">{p.title}</h3>
                <div className="party-info">
                  <span>{p.date}</span>
                  <span>· {p.place}</span>
                </div>
              </div>
              <div className="party-meta">
                <span>댓글 {p.comments}</span>
                <span>{p.members}</span>
                <span className="party-dday">{p.dday}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 커뮤니티 */}
      <section className="section section-community">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">💬</span>
            <span>커뮤니티</span>
          </div>
        </div>

        <div className="community-grid">
          {/* 질문 게시판 */}
          <div className="community-card">
            <div className="community-card-header">
              <span className="community-label">질문 게시판</span>

              {/* 🔗 커뮤니티 페이지 탭(질문)으로 이동 */}
              <Link to="/community" className="link-button">
                더보기 →
              </Link>
            </div>
            <ul className="community-list">
              {questions.map((q) => (
                <li key={q.id} className="community-item">
                  <div className="community-title">{q.title}</div>
                  <div className="community-meta">
                    <span>#{q.tag}</span>
                    <span>{q.time}</span>
                    <span>조회 {q.views}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 리뷰 게시판 */}
          <div className="community-card">
            <div className="community-card-header">
              <span className="community-label">리뷰 게시판</span>

              {/* 🔗 커뮤니티 페이지 탭(리뷰)으로 이동 (지금은 같은 주소로만) */}
              <Link to="/community" className="link-button">
                더보기 →
              </Link>
            </div>
            <ul className="community-list">
              {reviews.map((r) => (
                <li key={r.id} className="review-item">
                  <div className="review-thumb" />
                  <div className="review-body">
                    <div className="community-title">{r.title}</div>
                    <div className="community-meta">
                      <span>{r.place}</span>
                      <span>★ {r.rating}</span>
                      <span>좋아요 {r.likes}</span>
                      <span>댓글 {r.comments}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}