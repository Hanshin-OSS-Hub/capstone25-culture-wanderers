import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { BadgePercent, CalendarDays, ChevronLeft, ChevronRight, MapPin, Music4, Palette, PartyPopper, Search, Sparkles, Users } from 'lucide-react';

import FestivalCard from '../components/FestivalCard.jsx';
import BenefitCard from '../components/BenefitCard.jsx';
import { authFetch } from '../api/authFetch';
import { useAuth } from '../auth/AuthContext';
import { benefits } from '../data/benefits';

import './Home.css';

const API_BASE = 'http://localhost:8080';

const HERO_TAGS = [
  { label: '# 성수놀거리', params: { q: '성수' } },
  { label: '# 종로전시', params: { q: '종로', region: '서울', category: '전시' } },
  { label: '# 서울공연', params: { region: '서울', category: '공연' } },
  { label: '# 주말축제', params: { category: '축제' } },
];

const HERO_SHORTCUTS = [
  { label: '축제·행사', to: '/search?category=축제', icon: PartyPopper },
  { label: '전시·미술', to: '/search?category=전시', icon: Palette },
  { label: '공연·콘서트', to: '/search?category=공연', icon: Music4 },
  { label: '지역별 찾기', to: '/search', icon: MapPin },
  { label: '파티 모집', to: '/party', icon: Users },
  { label: '할인정보', to: '/benefits', icon: BadgePercent },
  { label: '취향 추천', to: '/result?personalized=1', icon: Sparkles },
];

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
  region: item.region,
  category: item.category ?? item.contentType,
  price: item.price,
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

  const [heroQuery, setHeroQuery] = useState('');
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  const previewBenefits = benefits.slice(0, 4);

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
          axios.get(`${API_BASE}/api/festivals/popular?limit=5`),
          authFetch('/api/recommend/personalized'),
          authFetch('/api/recommend/preferences'),
          axios.get(`${API_BASE}/api/party-posts`),
          axios.get(`${API_BASE}/api/posts?type=QUESTION`),
          authFetch('/api/reviews'),
          axios.get(`${API_BASE}/api/posts?type=FREE`),
        ]);

        const popularList = Array.isArray(popularResponse.data) ? popularResponse.data : [];
        const popularCards = popularList.map((item) => normalizeFestivalCard(item, item.popular ? '인기' : ''));
        setPopularFestivals(popularCards);

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
        const previewPartyItems = partyItems.slice(0, 3);
        const partyFestivalIds = [
          ...new Set(
            previewPartyItems
              .map((item) => item.festivalId)
              .filter((id) => id !== null && id !== undefined && id !== '')
          ),
        ];
        let partyFestivalCards = [];

        if (partyFestivalIds.length > 0) {
          const partySummaryResponse = await axios.get(`${API_BASE}/api/festivals/summaries`, {
            params: { ids: partyFestivalIds },
            paramsSerializer: {
              serialize: (params) =>
                (params.ids || []).map((id) => `ids=${encodeURIComponent(id)}`).join('&'),
            },
          });
          partyFestivalCards = Array.isArray(partySummaryResponse.data)
            ? partySummaryResponse.data.map((item) => normalizeFestivalCard(item, ''))
            : [];
        }

        const missingTitleItems = previewPartyItems.filter((item) => {
          if (!item.festivalTitle) return false;
          return !partyFestivalCards.some((festival) => {
            const sameId = item.festivalId && String(festival.id) === String(item.festivalId);
            const sameTitle = String(festival.title || '').trim() === String(item.festivalTitle || '').trim();
            return sameId || sameTitle;
          });
        });

        const titleCandidateResponses = await Promise.allSettled(
          missingTitleItems.map((item) =>
            axios.get(`${API_BASE}/api/festivals/link-candidates`, {
              params: { query: item.festivalTitle, region: item.location },
            })
          )
        );

        titleCandidateResponses.forEach((result) => {
          if (result.status !== 'fulfilled') return;
          const candidates = Array.isArray(result.value.data) ? result.value.data : [];
          if (candidates[0]) {
            partyFestivalCards.push(normalizeFestivalCard(candidates[0], ''));
          }
        });

        setPartyList(
          previewPartyItems.map((item) => {
            const matchedFestival = [...partyFestivalCards, ...popularCards].find((festival) => {
              const sameId = item.festivalId && String(festival.id) === String(item.festivalId);
              const sameTitle =
                item.festivalTitle &&
                String(festival.title || '').trim() === String(item.festivalTitle || '').trim();
              return sameId || sameTitle;
            });

            return {
              id: item.id,
              title: item.title || item.festivalTitle || '파티 모집글',
              festivalTitle: item.festivalTitle || matchedFestival?.title || '연결된 행사',
              meta: normalizePartyMeta(item),
              commentCount: item.commentCount ?? 0,
              members: `${item.currentPeople ?? 0}/${item.maxPeople ?? 0}명`,
              image:
                item.thumbnailUrl ||
                item.thumbnail_url ||
                item.festivalThumbnailUrl ||
                item.festivalThumbnail_url ||
                matchedFestival?.thumbnail_url ||
                '',
            };
          })
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

  const heroPopularFestivals = useMemo(() => popularFestivals.slice(0, 5), [popularFestivals]);
  const featuredFestival = heroPopularFestivals[heroSlideIndex] || heroPopularFestivals[0] || null;
  const heroSlideCount = Math.max(heroPopularFestivals.length, 1);
  const heroCandidateFestivals = useMemo(() => {
    if (heroPopularFestivals.length <= 1) return [];

    return [1, 2]
      .map((offset) => heroPopularFestivals[(heroSlideIndex + offset) % heroPopularFestivals.length])
      .filter(Boolean);
  }, [heroPopularFestivals, heroSlideIndex]);

  useEffect(() => {
    if (heroSlideIndex >= heroPopularFestivals.length && heroPopularFestivals.length > 0) {
      setHeroSlideIndex(0);
    }
  }, [heroPopularFestivals.length, heroSlideIndex]);

  const moveHeroSlide = (direction) => {
    setHeroSlideIndex((current) => {
      if (heroPopularFestivals.length === 0) return 0;
      return (current + direction + heroPopularFestivals.length) % heroPopularFestivals.length;
    });
  };

  const handleHeroSearch = (event) => {
    event.preventDefault();
    const keyword = heroQuery.trim();
    if (!keyword) {
      navigate('/search');
      return;
    }

    const params = new URLSearchParams({ q: keyword });
    navigate(`/result?${params.toString()}`);
  };

  const openHeroTag = (tagParams) => {
    const query = tagParams.q || '';
    setHeroQuery(query);
    const params = new URLSearchParams(tagParams);
    navigate(`/result?${params.toString()}`);
  };

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
        <div className="hero-surface">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="hero-kicker">내 취향에 맞는 문화생활 가이드</span>
              <h1 className="hero-title">
                이번 주, 어디서
                <br />
                <span>문화생활</span> 할까요?
              </h1>
              <p className="hero-subtitle">
                축제, 전시, 공연부터 같이 갈 사람까지. 지금 보고 싶은 문화생활을 가볍게
                찾아보세요.
              </p>

              <form className="hero-search-form" onSubmit={handleHeroSearch}>
                <Search size={18} strokeWidth={2.2} />
                <input
                  value={heroQuery}
                  onChange={(event) => setHeroQuery(event.target.value)}
                  placeholder="지역, 행사, 장소를 검색해보세요"
                />
                <button type="submit">찾아보기</button>
              </form>

              <div className="hero-tag-row">
                {HERO_TAGS.map((tag) => (
                  <button key={tag.label} type="button" onClick={() => openHeroTag(tag.params)}>
                    {tag.label}
                  </button>
                ))}
              </div>

              <div className="hero-cta-row">
                <Link to={isAuthed ? "/result?personalized=1" : "/search"} className="hero-primary-link">
                  취향 추천 보기
                </Link>
                <Link to="/party" className="hero-secondary-link">
                  같이 갈 사람 찾기
                </Link>
              </div>
            </div>

            <aside className="hero-stage" aria-label="인기 문화행사 미리보기">
              <div className="hero-stage-head">
                <span>이번 주 인기축제</span>
                <Link to="/search" className="hero-feature-link">
                  전체보기 →
                </Link>
              </div>

              <div className="hero-stage-main">
                <Link
                  to={featuredFestival?.id ? `/detail/${featuredFestival.id}` : '/search'}
                  className="hero-main-link"
                  aria-label={`${featuredFestival?.title || '인기 문화행사'} 상세보기`}
                >
                  <div
                    className="hero-stage-visual"
                    style={{
                      backgroundImage: featuredFestival?.thumbnail_url
                        ? `linear-gradient(135deg, rgba(22, 28, 45, 0.08), rgba(22, 28, 45, 0.08)), url(${featuredFestival.thumbnail_url})`
                        : 'linear-gradient(135deg, #f9d8df 0%, #fde9d6 48%, #dff1f8 100%)',
                    }}
                  />
                  <div className="hero-stage-card">
                    <div className="hero-stage-card-top">
                      <span className="hero-stage-badge">인기축제</span>
                    </div>
                    <strong>{featuredFestival?.title || '이번 주 인기 문화생활'}</strong>
                    <p>{featuredFestival?.place || '서울부터 지역 축제까지 인기 행사를 한 번에 확인해보세요.'}</p>
                    <div className="hero-stage-meta">
                      <span>
                        <CalendarDays size={14} />
                        {featuredFestival?.period || '실시간 집계 중'}
                      </span>
                      <span>
                        <MapPin size={14} />
                        {featuredFestival?.region || '전국'}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="hero-slide-controls" aria-label="인기축제 슬라이드">
                  <button type="button" onClick={() => moveHeroSlide(-1)} aria-label="이전 인기축제">
                    <ChevronLeft size={18} />
                  </button>
                  <span>{heroPopularFestivals.length > 0 ? heroSlideIndex + 1 : 0} / {heroSlideCount}</span>
                  <button type="button" onClick={() => moveHeroSlide(1)} aria-label="다음 인기축제">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {heroCandidateFestivals.length > 0 ? (
                <div className="hero-candidate-list" aria-label="다음 인기 문화행사 후보">
                  {heroCandidateFestivals.map((festival, index) => (
                    <Link key={`${festival.id}-${index}`} to={`/detail/${festival.id}`} className="hero-candidate-card">
                      <div
                        className="hero-candidate-thumb"
                        style={{
                          backgroundImage: festival.thumbnail_url ? `url(${festival.thumbnail_url})` : 'none',
                        }}
                      />
                      <div className="hero-candidate-body">
                        <strong>{festival.title}</strong>
                        <small>{festival.period}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </aside>
          </div>

          <div className="hero-shortcuts" aria-label="빠른 카테고리 이동">
            {HERO_SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} to={item.to} className="hero-shortcut-card">
                  <span className="hero-shortcut-icon">
                    <Icon size={20} strokeWidth={2.1} />
                  </span>
                  <strong>{item.label}</strong>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section home-feature-grid">
        <div className="section-personalized home-feature-main">
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
        </div>

        <aside className="home-party-panel" aria-label="지금 모집 중인 파티">
          <div className="section-header">
            <div className="section-title">
              <span>지금 모집 중인 파티</span>
            </div>
            <Link to="/party" className="link-button">
              전체보기 →
            </Link>
          </div>

          <div className="home-party-list">
            {partyList.length > 0 ? (
              partyList.map((party) => (
                <Link key={party.id} to={`/party/${party.id}`} className="home-party-card">
                  <div
                    className="home-party-thumb"
                    style={{
                      backgroundImage: party.image ? `url(${party.image})` : 'none',
                    }}
                  />
                  <div className="home-party-body">
                    <div className="home-party-status">모집중</div>
                    <strong>{party.title}</strong>
                    <span>{party.festivalTitle}</span>
                    <small>{party.meta}</small>
                    <div className="home-party-meta">
                      <span>
                        <Users size={13} />
                        {party.members}
                      </span>
                      <span>댓글 {party.commentCount}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="community-empty">
                현재 모집 중인 파티가 없어요. 마음에 드는 행사에서 첫 파티를 열어보세요.
              </div>
            )}
          </div>
        </aside>
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
