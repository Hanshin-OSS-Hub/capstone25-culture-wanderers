import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SearchPanel from "../components/SearchPanel.jsx";
import FestivalCard from "../components/FestivalCard.jsx";
import BenefitCard from "../components/BenefitCard.jsx";
import { benefits } from "../data/benefits";
import { isFestivalLiked } from "../utils/likeStorage";
import { authFetch } from "../api/authFetch";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const [festivals, setFestivals] = useState([]);
  const [partyList, setPartyList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);

  const previewBenefits = benefits.slice(0, 3);

  const navigate = useNavigate();

  const [recommendRegion, setRecommendRegion] = useState("");
  const [recommendBudget, setRecommendBudget] = useState("");
  const [recommendCompanion, setRecommendCompanion] = useState("");

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

  const handleRecommend = () => {
    const params = new URLSearchParams();

    if (recommendRegion) params.set("region", recommendRegion);
    if (recommendCompanion) params.set("companion", recommendCompanion);

    if (recommendBudget === "무료") {
      params.set("free", "1");
    } else if (recommendBudget === "1만원 이하") {
      params.set("maxPrice", "10000");
    } else if (recommendBudget === "3만원 이하") {
      params.set("maxPrice", "30000");
    }

    navigate(`/result?${params.toString()}`);
  };

  const partyRecommendMessages = useMemo(() => {
    const messages = [];

    if (partyList.length > 0) {
      messages.push(`현재 모집 중인 파티 ${partyList.length}건을 먼저 보여드려요.`);
    }

    messages.push("이 행사에 관심 있는 사용자와 연결될 수 있도록 파티 기능을 강화했어요.");
    messages.push("같은 날짜나 비슷한 지역의 행사 관심자를 기준으로 같이 갈 사람을 찾을 수 있어요.");
    messages.push("친구와 가기 좋은 행사라면 파티 모집글을 바로 확인할 수 있어요.");

    return messages.slice(0, 3);
  }, [partyList.length]);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">이번 주, 나한테 맞는 행사 추천받기</h1>
          <p className="hero-subtitle">
            조건만 선택하면 맞춤 행사를 추천해드려요
          </p>

          <div className="recommend-box">
            <div className="recommend-row">
              <span>지역</span>
              <button
                type="button"
                className={recommendRegion === "서울" ? "active" : ""}
                onClick={() =>
                  setRecommendRegion((prev) => (prev === "서울" ? "" : "서울"))
                }
              >
                서울
              </button>
              <button
                type="button"
                className={recommendRegion === "경기" ? "active" : ""}
                onClick={() =>
                  setRecommendRegion((prev) => (prev === "경기" ? "" : "경기"))
                }
              >
                경기
              </button>
              <button
                type="button"
                className={recommendRegion === "부산" ? "active" : ""}
                onClick={() =>
                  setRecommendRegion((prev) => (prev === "부산" ? "" : "부산"))
                }
              >
                부산
              </button>
            </div>

            <div className="recommend-row">
              <span>예산</span>
              <button
                type="button"
                className={recommendBudget === "무료" ? "active" : ""}
                onClick={() =>
                  setRecommendBudget((prev) => (prev === "무료" ? "" : "무료"))
                }
              >
                무료
              </button>
              <button
                type="button"
                className={recommendBudget === "1만원 이하" ? "active" : ""}
                onClick={() =>
                  setRecommendBudget((prev) => (prev === "1만원 이하" ? "" : "1만원 이하"))
                }
              >
                1만원 이하
              </button>
              <button
                type="button"
                className={recommendBudget === "3만원 이하" ? "active" : ""}
                onClick={() =>
                  setRecommendBudget((prev) => (prev === "3만원 이하" ? "" : "3만원 이하"))
                }
              >
                3만원 이하
              </button>
            </div>

            <div className="recommend-row">
              <span>동행</span>
              <button
                type="button"
                className={recommendCompanion === "혼자" ? "active" : ""}
                onClick={() =>
                  setRecommendCompanion((prev) => (prev === "혼자" ? "" : "혼자"))
                }
              >
                혼자
              </button>
              <button
                type="button"
                className={recommendCompanion === "친구" ? "active" : ""}
                onClick={() =>
                  setRecommendCompanion((prev) => (prev === "친구" ? "" : "친구"))
                }
              >
                친구
              </button>
              <button
                type="button"
                className={recommendCompanion === "데이트" ? "active" : ""}
                onClick={() =>
                  setRecommendCompanion((prev) => (prev === "데이트" ? "" : "데이트"))
                }
              >
                데이트
              </button>
            </div>

            <button
              type="button"
              className="recommend-btn"
              onClick={handleRecommend}
              disabled={!recommendRegion && !recommendBudget && !recommendCompanion}
            >
              추천받기
            </button>
          </div>

          <SearchPanel />
        </div>
      </section>

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

      <section className="section section-parties">
        <div className="section-header">
          <div className="section-title">
            <span>지금 모집 중인 파티</span>
          </div>

          <Link to="/party" className="link-button">
            전체보기 →
          </Link>
        </div>

        <div className="party-recommend-box">
          <div className="party-recommend-title">같이 갈 사람 추천</div>
          <ul className="party-recommend-list">
            {partyRecommendMessages.map((message, idx) => (
              <li key={idx}>{message}</li>
            ))}
          </ul>
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
            <div className="community-empty">
              현재 모집 중인 파티가 없습니다. 관심 있는 행사에서 먼저 파티를 만들어보세요.
            </div>
          )}
        </div>
      </section>

      <section className="section section-community">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">💬</span>
            <span>커뮤니티</span>
          </div>
        </div>

        <div className="community-grid">
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