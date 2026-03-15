import { useEffect, useState } from "react";
import axios from "axios";
import SearchPanel from "../components/SearchPanel.jsx";
import FestivalCard from "../components/FestivalCard.jsx";
import { Link } from "react-router-dom";

import BenefitCard from "../components/BenefitCard.jsx";
import { benefits } from "../data/benefits";
import { isFestivalLiked } from "../utils/likeStorage";
import { authFetch } from "../api/authFetch";
import "./Home.css";

export default function Home() {
  const [festivals, setFestivals] = useState([]);
  const [partyList, setPartyList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);

  const previewBenefits = benefits.slice(0, 3);

  useEffect(() => {
    const formatDate = (dateString) => {
      if (!dateString || String(dateString).startsWith("0000")) {
        return "공식정보를 확인하세요";
      }

      let dateText = String(dateString);

      if (dateText.includes("T")) {
        dateText = dateText.split("T")[0];
      }

      if (dateText.length === 8) {
        return `${dateText.slice(0, 4)}.${dateText.slice(4, 6)}.${dateText.slice(6, 8)}`;
      }

      const date = new Date(dateText);
      if (Number.isNaN(date.getTime())) return "공식정보를 확인하세요";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    };

    const fetchData = async () => {
      let normalizedReviewList = [];
      let normalizedPartyList = [];

      // 1) 내 리뷰 / 내 파티글 먼저 불러오기
      try {
        const [reviewData, partyData] = await Promise.all([
          authFetch("/api/me/reviews"),
          authFetch("/api/me/party-posts"),
        ]);

        const reviewList = Array.isArray(reviewData)
          ? reviewData
          : Array.isArray(reviewData?.data)
            ? reviewData.data
            : [];

        const partyPostList = Array.isArray(partyData)
          ? partyData
          : Array.isArray(partyData?.data)
            ? partyData.data
            : [];

        normalizedReviewList = reviewList.map((review) => ({
          ...review,
          targetType: review.targetType || "",
          targetTitle: review.targetTitle || "",
          title: review.title || "",
          content: review.content || "",
          rating: review.rating ?? 0,
          createdAt: review.createdAt || "",
          likeCount: review.likeCount ?? 0,
          commentCount: review.commentCount ?? 0,
        }));

        normalizedPartyList = partyPostList.map((post) => ({
          ...post,
          id: post.id,
          festivalTitle: post.festivalTitle || "",
          title: post.title || "",
          content: post.content || "",
          region: post.region || "",
          location: post.location || "",
          maxPeople: post.maxPeople ?? post.maxMembers ?? 2,
          currentPeople: post.currentPeople ?? post.currentMembers ?? 0,
          commentCount: post.commentCount ?? 0,
          date: post.eventDate || post.date || "일정 미정",
          dday: post.dday || "",
        }));

        setReviews(
          normalizedReviewList.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title || "제목 없음",
            place: item.targetTitle || "축제",
            rating: item.rating ?? 0,
            likes: item.likeCount ?? 0,
            comments: item.commentCount ?? 0,
          }))
        );

        setPartyList(
          normalizedPartyList.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title || "제목 없음",
            date: item.date || "일정 미정",
            place: item.region || item.location || item.festivalTitle || "장소 미정",
            comments: item.commentCount ?? 0,
            members: `${item.currentPeople ?? 0}/${item.maxPeople ?? 2}명`,
            dday: item.dday || "",
          }))
        );

        setQuestions([]);
      } catch (error) {
        console.error("내 리뷰/파티 데이터 로딩 실패:", error);
        setReviews([]);
        setPartyList([]);
        setQuestions([]);
      }

      // 2) 축제 목록은 3000번 서버에서 불러오기
      try {
        const festivalResponse = await axios.get("http://localhost:3000/api/festivals");

        const rawFestivalData = festivalResponse.data;
        const festivalData = Array.isArray(rawFestivalData)
          ? rawFestivalData
          : Array.isArray(rawFestivalData?.data)
            ? rawFestivalData.data
            : Array.isArray(rawFestivalData?.content)
              ? rawFestivalData.content
              : [];

        const mappedFestivals = festivalData.slice(0, 4).map((item) => {
          const currentFestivalTitle = String(item.title || "")
            .trim()
            .toLowerCase();

          const relatedReviews = normalizedReviewList.filter((review) => {
            const targetType = String(review.targetType || "").trim().toLowerCase();
            const targetTitle = String(review.targetTitle || "").trim().toLowerCase();
            const reviewTitle = String(review.title || "").trim().toLowerCase();
            const reviewContent = String(review.content || "").trim().toLowerCase();

            return (
              targetType === "festival" &&
              (
                targetTitle === currentFestivalTitle ||
                reviewTitle.includes(currentFestivalTitle) ||
                reviewContent.includes(currentFestivalTitle)
              )
            );
          });

          const relatedPartyPosts = normalizedPartyList.filter((post) => {
            const festivalTitle = String(post.festivalTitle || "").trim().toLowerCase();
            const postTitle = String(post.title || "").trim().toLowerCase();
            const postContent = String(post.content || "").trim().toLowerCase();

            return (
              festivalTitle === currentFestivalTitle ||
              postTitle.includes(currentFestivalTitle) ||
              postContent.includes(currentFestivalTitle)
            );
          });

          const liked = isFestivalLiked(item.id);

          const isHotFestival =
            relatedReviews.length >= 2 ||
            relatedPartyPosts.length >= 2 ||
            (liked && relatedReviews.length >= 1);

          return {
            id: item.id,
            title: item.title,
            period:
              item.start_date || item.end_date
                ? `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`
                : "공식정보를 확인하세요",
            place: [item.region, item.location].filter(Boolean).join(" "),
            thumbnail_url: item.thumbnail_url,
            badge: isHotFestival ? "인기" : "",
            reviews: relatedReviews.length,
          };
        });

        setFestivals(mappedFestivals);
      } catch (error) {
        console.error("축제 데이터 로딩 실패:", error);
        setFestivals([]);
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

      {/* 이번 주 인기 축제 <span className="section-icon">🔥</span> */}
      <section className="section section-popular">
        <div className="section-header">
          <div className="section-title">
            
            <span>이번 주 인기 축제</span>
          </div>

          <Link to="/search" className="link-button">
            전체보기 →
          </Link>
        </div>

        <div className="card-row">
          {festivals.length > 0 ? (
            festivals.map((f) => <FestivalCard key={f.id} festival={f} />)
          ) : (
            <div className="community-empty">표시할 축제 정보가 없습니다.</div>
          )}
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

        <div className="home-student-row">
          {previewBenefits.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      </section>

      {/* 지금 모집 중인 파티 <span className="section-icon">👥</span> */}
      <section className="section section-parties">
        <div className="section-header">
          <div className="section-title">
            
            <span>지금 모집 중인 파티</span>
          </div>

          <Link to="/party" className="link-button">
            전체보기 →
          </Link>
        </div>

        <div className="party-list">
          {partyList.length > 0 ? (
            partyList.map((p) => (
              <Link
                key={p.id}
                to={`/party/${p.id}`}
                className="party-item"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
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
                  {p.dday && <span className="party-dday">{p.dday}</span>}
                </div>
              </Link>
            ))
          ) : (
            <div className="community-empty">현재 모집 중인 파티가 없습니다.</div>
          )}
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
              {questions.length > 0 ? (
                questions.map((q) => (
                  <li key={q.id} className="community-item">
                    <div className="community-title">{q.title}</div>
                    <div className="community-meta">
                      <span>#{q.tag}</span>
                      <span>{q.time}</span>
                      <span>조회 {q.views}</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="community-item">
                  <div className="community-title">등록된 질문이 없습니다.</div>
                </li>
              )}
            </ul>
          </div>

          {/* 리뷰 게시판 */}
          <div className="community-card">
            <div className="community-card-header">
              <span className="community-label">리뷰 게시판</span>

              <Link to="/community?tab=review" className="link-button">
                더보기 →
              </Link>
            </div>

            <ul className="community-list">
              {reviews.length > 0 ? (
                reviews.map((r) => (
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
                ))
              ) : (
                <li className="community-item">
                  <div className="community-title">등록된 리뷰가 없습니다.</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}