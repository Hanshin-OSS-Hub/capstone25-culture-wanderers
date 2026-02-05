import { useEffect, useState } from "react";
import axios from "axios";
import SearchPanel from "../components/SearchPanel.jsx";
import FestivalCard from "../components/FestivalCard.jsx";
import { Link } from "react-router-dom";

import BenefitCard from "../components/BenefitCard.jsx";
import { benefits } from "../data/benefits";
import "./Home.css";


// 파티 모집 더미 데이터
const partyList = [
  {
    id: 1,
    title: "서울 빛초롱 축제 같이 보러 갈 사람 구해요!",
    date: "11.30 (토) 18:00",
    place: "청계천",
    comments: 5,
    members: "3/5명",
    dday: "D-3",
  },
  {
    id: 2,
    title: "부산 불꽃 축제 함께 즐길 분",
    date: "12.03 (화) 19:30",
    place: "광안리 해변",
    comments: 12,
    members: "2/4명",
    dday: "D-6",
  },
  {
    id: 3,
    title: "현대미술 전시 관람 후 카페 가요~",
    date: "12.05 (목) 15:00",
    place: "국립현대미술관 서울관",
    comments: 3,
    members: "4/6명",
    dday: "D-8",
  },
];

// 커뮤니티 질문 / 리뷰 더미
const questions = [
  {
    id: 1,
    title: "한번 축제비용 적당히 어느 정도가 좋을까요?",
    tag: "축제예산",
    time: "2시간 전",
    views: 128,
  },
  {
    id: 2,
    title: "부산 불꽃 축제날 예약 팁 있을까요?",
    tag: "부산",
    time: "어제",
    views: 523,
  },
  {
    id: 3,
    title: "전시회 사진 촬영 가능한가요?",
    tag: "전시예절",
    time: "3일 전",
    views: 159,
  },
];

const reviews = [
  {
    id: 1,
    title: "서울 한밤 페스티벌 다녀왔어요 (사진 많음)",
    place: "서울",
    rating: 4.5,
    likes: 29,
    comments: 6,
  },
  {
    id: 2,
    title: "락페스티벌 생존 팁 정리",
    place: "인천",
    rating: 5.0,
    likes: 40,
    comments: 18,
  },
  {
    id: 3,
    title: "푸드 페스티벌 먹방 투어 후기",
    place: "경기",
    rating: 4.0,
    likes: 19,
    comments: 10,
  },
];



export default function Home() {
  const [festivals, setFestivals] = useState([]);

  // 더미 데이터 삭제 후 학생 할인 미리보기: 12개 데이터 중 앞 3개만
  const previewBenefits = benefits.slice(0, 3);

  useEffect(() => {
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    };
    

    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/festivals");

        const mappedData = response.data.slice(0, 4).map((item) => ({
          id: item.id,
          title: item.title,
          period: `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`,
          place: `${item.region} ${item.location}`,
          badge: "인기",
          reviews: Math.floor(Math.random() * 100) + 10,
          thumbnail_url: item.thumbnail_url,
        }));

        setFestivals(mappedData);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      }
    };

    fetchData();
  }, []);

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

          <Link to="/benefits" className="link-button">
            전체보기 →
          </Link>
        </div>

        {/* 더미 제거하고 previewBenefits로 렌더링 */}
        <div className="home-student-row">
          {previewBenefits.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
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
