import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

import FestivalCard from '../components/FestivalCard.jsx';
import BenefitCard from '../components/BenefitCard.jsx';
import { authFetch } from '../api/authFetch';
import { useAuth } from '../auth/AuthContext';
import { benefits } from '../data/benefits';

import './Home.css';

const API_BASE = 'http://localhost:8080';

const REGION_OPTIONS = [
  '서울특별시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

const BUDGET_OPTIONS = ['무료', '1만원 이하', '3만원 이하', '5만원 이하'];
const COMPANION_OPTIONS = ['혼자', '친구', '데이트', '가족'];

const formatDate = (value) => {
  if (!value) return '일정 정보 없음';

  const raw = String(value).split('T')[0].replace(/-/g, '');
  if (!/^\d{8}$/.test(raw)) return '일정 정보 없음';

  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
};

const formatPlace = (regionValue, locationValue) => {
  const regionText = String(regionValue || '').trim();
  const locationText = String(locationValue || '').trim();

  if (!regionText) return locationText;
  if (!locationText) return regionText;
  if (locationText.startsWith(regionText)) return locationText;
  return `${regionText} ${locationText}`;
};

const normalizeFestivalCard = (item, badge) => ({
  id: item.id,
  title: item.title,
  period: `${formatDate(item.startDate ?? item.start_date)} - ${formatDate(item.endDate ?? item.end_date)}`,
  place: formatPlace(item.region, item.location),
  thumbnail_url: item.thumbnailUrl ?? item.thumbnail_url ?? '',
  badge,
  reviews: item.reviewCount ?? item.review_count ?? 0,
  like_count: item.likeCount ?? item.like_count ?? 0,
  view_count: item.viewCount ?? item.view_count ?? 0,
});

const normalizePartyMeta = (item) =>
  [
    item.meetingTime ? String(item.meetingTime).slice(0, 10) : '일정 미정',
    item.location || item.festivalTitle || '장소 미정',
  ]
    .filter(Boolean)
    .join(' · ');

export default function Home() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const [popularFestivals, setPopularFestivals] = useState([]);
  const [personalizedFestivals, setPersonalizedFestivals] = useState([]);
  const [preferenceSummary, setPreferenceSummary] = useState(null);
  const [partyList, setPartyList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [freePosts, setFreePosts] = useState([]);

  const [recommendRegion, setRecommendRegion] = useState('');
  const [recommendBudget, setRecommendBudget] = useState('');
  const [recommendCompanion, setRecommendCompanion] = useState('');
  const [recommendDate, setRecommendDate] = useState('');

  const previewBenefits = benefits.slice(0, 3);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [
          popularResponse,
          recommendResponse,
          preferenceResponse,
          partyResponse,
          questionResponse,
          reviewResponse,
          freeResponse,
        ] = await Promise.all([
          axios.get(`${API_BASE}/api/festivals/popular?limit=4`),
          authFetch('/api/recommend/personalized'),
          authFetch('/api/recommend/preferences'),
          axios.get(`${API_BASE}/api/party-posts`),
          axios.get(`${API_BASE}/api/posts?type=QUESTION`),
          authFetch('/api/reviews'),
          axios.get(`${API_BASE}/api/posts?type=FREE`),
        ]);

        const popularList = Array.isArray(popularResponse.data) ? popularResponse.data : [];
        setPopularFestivals(
          popularList.map((item) => normalizeFestivalCard(item, item.popular ? '인기' : ''))
        );

        const recommendList = Array.isArray(recommendResponse) ? recommendResponse : [];
        if (recommendList.length > 0) {
          const summaryResponse = await axios.get(`${API_BASE}/api/festivals/summaries`, {
            params: { ids: recommendList.slice(0, 4).map((item) => item.id) },
            paramsSerializer: {
              serialize: (params) =>
                (params.ids || []).map((id) => `ids=${encodeURIComponent(id)}`).join('&'),
            },
          });

          const summaryList = Array.isArray(summaryResponse.data) ? summaryResponse.data : [];
          setPersonalizedFestivals(
            summaryList.map((item) => normalizeFestivalCard(item, '취향추천'))
          );
        } else {
          setPersonalizedFestivals([]);
        }

        setPreferenceSummary(preferenceResponse || null);

        const partyItems = Array.isArray(partyResponse.data) ? partyResponse.data : [];
        setPartyList(
          partyItems.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title || item.festivalTitle || '파티 모집글',
            meta: normalizePartyMeta(item),
            commentCount: item.commentCount ?? 0,
            members: `${item.currentPeople ?? 0}/${item.maxPeople ?? 0}명`,
          }))
        );

        const questionItems = Array.isArray(questionResponse.data) ? questionResponse.data : [];
        setQuestions(
          questionItems.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title || '제목 없음',
            meta: `댓글 ${item.commentCount ?? 0} · 조회 ${item.viewCount ?? 0}`,
          }))
        );

        const reviewItems = Array.isArray(reviewResponse) ? reviewResponse : [];
        setReviews(
          reviewItems.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title || '제목 없음',
            meta: `${item.targetTitle || '축제'} · 댓글 ${item.commentCount ?? 0}`,
          }))
        );

        const freeItems = Array.isArray(freeResponse.data) ? freeResponse.data : [];
        setFreePosts(
          freeItems.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title || '제목 없음',
            meta: `${item.regionTag || '자유'} · 조회 ${item.viewCount ?? 0}`,
          }))
        );
      } catch (error) {
        console.error('홈 데이터 로딩 실패:', error);
        setPopularFestivals([]);
        setPersonalizedFestivals([]);
        setPreferenceSummary(null);
        setPartyList([]);
        setQuestions([]);
        setReviews([]);
        setFreePosts([]);
      }
    };

    fetchHomeData();
  }, []);

  const personalizedSummary = useMemo(() => {
    if (!preferenceSummary) {
      return '최근 기록을 바탕으로 맞춤 추천을 준비하고 있어요.';
    }

    const region =
      preferenceSummary.topRegion || preferenceSummary.selectedRegions?.[0] || '관심 지역';
    const category =
      preferenceSummary.topCategory ||
      preferenceSummary.selectedCategories?.[0] ||
      '관심 카테고리';

    return `최근 관심 지역 ${region} · 관심 카테고리 ${category}를 반영했어요.`;
  }, [preferenceSummary]);

  const displayPersonalizedSummary = useMemo(() => {
    if (!isAuthed) {
      return '로그인하면 취향 기반 추천을 볼 수 있어요. 지금은 인기 축제를 보여드려요.';
    }

    if (!preferenceSummary) {
      return '최근 기록을 바탕으로 맞춤 추천을 준비하고 있어요.';
    }

    const region =
      preferenceSummary.topRegion || preferenceSummary.selectedRegions?.[0] || '관심 지역';
    const category =
      preferenceSummary.topCategory ||
      preferenceSummary.selectedCategories?.[0] ||
      '관심 카테고리';

    return `최근 관심 지역 ${region} · 관심 카테고리 ${category}를 반영했어요.`;
  }, [isAuthed, preferenceSummary]);

  const homeRecommendationFestivals = useMemo(() => {
    if (isAuthed && personalizedFestivals.length > 0) {
      return personalizedFestivals.slice(0, 4);
    }

    return popularFestivals.slice(0, 4);
  }, [isAuthed, personalizedFestivals, popularFestivals]);

  const canRecommend =
    Boolean(recommendRegion) ||
    Boolean(recommendBudget) ||
    Boolean(recommendCompanion) ||
    Boolean(recommendDate);

  const handleRecommend = () => {
    if (!canRecommend) return;

    const params = new URLSearchParams();

    if (recommendRegion) params.set('region', recommendRegion);
    if (recommendCompanion) params.set('companion', recommendCompanion);
    if (recommendDate) params.set('date', recommendDate);

    if (recommendBudget === '무료') {
      params.set('free', '1');
    } else if (recommendBudget === '1만원 이하') {
      params.set('maxPrice', '10000');
    } else if (recommendBudget === '3만원 이하') {
      params.set('maxPrice', '30000');
    } else if (recommendBudget === '5만원 이하') {
      params.set('maxPrice', '50000');
    }

    navigate(`/result?${params.toString()}`);
  };

  const partyRecommendMessages = [
    '현재 모집 중인 파티부터 먼저 보여드려요.',
    '이 행사에 관심 있는 사용자와 연결될 수 있도록 파티 기능을 강화했어요.',
    '같은 날짜나 비슷한 지역의 행사 관심자를 기준으로 같이 갈 사람을 찾을 수 있어요.',
  ];

  const renderCommunityColumn = (title, moreTo, items, emptyText) => (
    <div className="community-card">
      <div className="community-card-header">
        <span className="community-label">{title}</span>
        <Link to={moreTo} className="link-button">
          더보기 →
        </Link>
      </div>

      <ul className="community-list">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item.id} className="community-item">
              <Link
                to={
                  moreTo.includes('review')
                    ? `/community/review/${item.id}`
                    : moreTo.includes('free')
                    ? `/community/free/${item.id}`
                    : `/community/question/${item.id}`
                }
                className="community-title"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {item.title}
              </Link>
              <div className="community-meta">{item.meta}</div>
            </li>
          ))
        ) : (
          <li className="community-item">
            <div className="community-title">{emptyText}</div>
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">이번 주, 취향에 맞는 문화행사를 골라볼까요?</h1>
          <p className="hero-subtitle">
            지역, 예산, 동행, 날짜 중 하나만 골라도 바로 추천 결과로 이어져요.
          </p>

          <div className="recommend-box">
            <div className="recommend-group">
              <div className="recommend-label">지역</div>
              <div className="recommend-row">
                {REGION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={recommendRegion === option ? 'active' : ''}
                    onClick={() => setRecommendRegion((prev) => (prev === option ? '' : option))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="recommend-group">
              <div className="recommend-label">예산</div>
              <div className="recommend-row">
                {BUDGET_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={recommendBudget === option ? 'active' : ''}
                    onClick={() => setRecommendBudget((prev) => (prev === option ? '' : option))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="recommend-group">
              <div className="recommend-label">동행</div>
              <div className="recommend-row">
                {COMPANION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={recommendCompanion === option ? 'active' : ''}
                    onClick={() =>
                      setRecommendCompanion((prev) => (prev === option ? '' : option))
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="recommend-group recommend-date-group">
              <label className="recommend-label" htmlFor="home-recommend-date">
                날짜
              </label>
              <input
                id="home-recommend-date"
                className="recommend-date-input"
                type="date"
                value={recommendDate}
                onChange={(e) => setRecommendDate(e.target.value)}
              />
            </div>

            <div className="recommend-help">
              하나만 골라도 추천받을 수 있어요. 여러 조건을 함께 고르면 더 취향에 가깝게 추천해드려요.
            </div>

            <button
              type="button"
              className="recommend-btn"
              onClick={handleRecommend}
              disabled={!canRecommend}
            >
              추천 받기
            </button>
          </div>
        </div>
      </section>

      <section className="section section-personalized">
        <div className="section-header">
          <div className="section-title">
            <span>취향 기반 추천 행사</span>
          </div>
          <Link to={isAuthed ? "/result?personalized=1" : "/search"} className="link-button">
            더 둘러보기
          </Link>
        </div>

        <div className="personalized-reason">{displayPersonalizedSummary}</div>

        <div className="card-row">
          {homeRecommendationFestivals.length > 0 ? (
            homeRecommendationFestivals.map((festival) => (
              <FestivalCard key={festival.id} festival={festival} />
            ))
          ) : (
            <div className="community-empty">
              아직 추천할 기록이 충분하지 않아요. 조금만 더 둘러보면 바로 반영할게요.
            </div>
          )}
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
          {popularFestivals.length > 0 ? (
            popularFestivals.slice(0, 4).map((festival) => (
              <FestivalCard key={festival.id} festival={festival} />
            ))
          ) : (
            <div className="community-empty">표시할 인기 축제가 아직 없어요.</div>
          )}
        </div>
      </section>

      <section className="section section-student">
        <div className="section-header">
          <div className="section-title">
            <span>할인정보 모아보기</span>
          </div>
          <Link to="/benefits" className="link-button">
            전체보기 →
          </Link>
        </div>

        <div className="home-student-row">
          {previewBenefits.map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} />
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
            {partyRecommendMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>

        <div className="party-list">
          {partyList.length > 0 ? (
            partyList.map((party) => (
              <Link
                key={party.id}
                to={`/party/${party.id}`}
                className="party-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="party-main">
                  <h3 className="party-title">{party.title}</h3>
                  <div className="party-info">{party.meta}</div>
                </div>

                <div className="party-meta">
                  <span>댓글 {party.commentCount}</span>
                  <span>{party.members}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="community-empty">
              현재 모집 중인 파티가 없어요. 마음에 드는 행사에서 첫 파티를 열어보세요.
            </div>
          )}
        </div>
      </section>

      <section className="section section-community">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">✎</span>
            <span>커뮤니티</span>
          </div>
        </div>

        <div className="community-grid community-grid-three">
          {renderCommunityColumn(
            '질문 게시판',
            '/community?tab=question',
            questions,
            '등록된 질문이 없습니다.'
          )}
          {renderCommunityColumn(
            '리뷰 게시판',
            '/community?tab=review',
            reviews,
            '등록된 리뷰가 없습니다.'
          )}
          {renderCommunityColumn(
            '자유게시판',
            '/community?tab=free',
            freePosts,
            '등록된 자유글이 없습니다.'
          )}
        </div>
      </section>
    </>
  );
}
