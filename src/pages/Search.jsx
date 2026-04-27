import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveActivity } from '../api/activity';
import { authFetch } from '../api/authFetch';
import '../App.css';

const REGION_ALL = '전체';
const CATEGORY_ALL = '전체';
const DATE_MODE_ALL = 'all';
const DATE_MODE_TODAY = 'today';
const DATE_MODE_WEEK = 'week';
const DATE_MODE_CUSTOM = 'custom';
const TAB_RECOMMENDED = 'recommended';
const TAB_ENDING_SOON = 'ending-soon';
const STATUS_ONGOING = 'ongoing';
const STATUS_ENDING_SOON = 'ending-soon';
const STATUS_PAST = 'past';

const regionOptions = [
  '전체', '서울', '경기', '부산', '인천', '대구', '광주', '대전', '울산', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const categoryOptions = ['전체', '전시', '공연', '축제', '체험'];

const formatPlace = (regionValue, locationValue) => {
  const regionText = String(regionValue || '').trim();
  const locationText = String(locationValue || '').trim();

  if (!regionText) return locationText;
  if (!locationText) return regionText;
  if (locationText.startsWith(regionText)) return locationText;
  return `${regionText} ${locationText}`;
};

const parseFestivalDate = (value) => {
  if (!value) return null;
  const raw = String(value).split('T')[0].replace(/-/g, '');
  if (!/^\d{8}$/.test(raw)) return null;
  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6));
  const day = Number(raw.slice(6, 8));
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const parsed = parseFestivalDate(value);
  if (!parsed) return '';
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
};

const formatInputDate = (value) => {
  const parsed = parseFestivalDate(value);
  if (!parsed) return '';
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const todayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatWon = (n) => `${Number(n).toLocaleString()}원`;

const getPriceNumber = (priceText) => {
  if (!priceText) return 0;
  const text = String(priceText);
  if (text.includes('무료') || text.includes('없음') || text.includes('0원')) return 0;
  const match = text.replace(/,/g, '').match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const isFreeFestival = (festival) => getPriceNumber(festival.price) === 0;

const normalizeFestival = (item) => ({
  ...item,
  thumbnail_url: item.thumbnail_url ?? item.thumbnailUrl ?? '',
  start_date: item.start_date ?? item.startDate ?? '',
  end_date: item.end_date ?? item.endDate ?? '',
  homepage_url: item.homepage_url ?? item.homepageUrl ?? '',
  review_count: item.review_count ?? item.reviewCount ?? 0,
  like_count: item.like_count ?? item.likeCount ?? 0,
  view_count: item.view_count ?? item.viewCount ?? 0,
  party_count: item.party_count ?? item.partyCount ?? 0,
  rating_avg: item.rating_avg ?? item.ratingAvg ?? 0,
  popularity_score: item.popularity_score ?? item.popularityScore ?? 0,
  popular: item.popular ?? false,
  price: item.price ?? '',
});

const Search = () => {
  const { search } = useLocation();
  const navigate = useNavigate();

  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [sortMode, setSortMode] = useState('recommend');

  const parsed = useMemo(() => {
    const params = new URLSearchParams(search);
    const freeOnly = params.get('free') === '1';
    const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : 50000;

    return {
      q: params.get('q') || '',
      region: params.get('region') || REGION_ALL,
      date: params.get('date') || '',
      category: params.get('category') || CATEGORY_ALL,
      personalized: params.get('personalized') === '1',
      tab: params.get('tab') || TAB_RECOMMENDED,
      status: params.get('status') || STATUS_ONGOING,
      limit: Math.max(Number(params.get('limit') || 10), 10),
      freeOnly,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : 50000,
    };
  }, [search]);

  const { q, region, date, category, personalized, tab, status, limit, freeOnly, maxPrice } = parsed;

  const [selectedRegion, setSelectedRegion] = useState(region);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [dateMode, setDateMode] = useState(DATE_MODE_ALL);
  const [selectedDate, setSelectedDate] = useState(date);
  const [freeOnlyState, setFreeOnlyState] = useState(freeOnly);
  const [maxPriceState, setMaxPriceState] = useState(maxPrice);
  const [recommendationLimitInput, setRecommendationLimitInput] = useState(String(limit));

  useEffect(() => {
    setSelectedRegion(region);
    setSelectedCategory(category);
    setSelectedDate(date);
    setDateMode(!date ? DATE_MODE_ALL : DATE_MODE_CUSTOM);
    setFreeOnlyState(freeOnly);
    setMaxPriceState(maxPrice);
    setRecommendationLimitInput(String(limit));
  }, [region, category, date, freeOnly, maxPrice, limit]);

  useEffect(() => {
    setSearchInput(q || '');
  }, [q]);

  const pushQuery = (next) => {
    const params = new URLSearchParams();

    if (next.region && next.region !== REGION_ALL) params.set('region', next.region);
    if (next.category && next.category !== CATEGORY_ALL) params.set('category', next.category);
    if (next.date) params.set('date', next.date);
    if (next.q && next.q.trim() !== '') params.set('q', next.q.trim());
    if (next.personalized) params.set('personalized', '1');
    if (next.tab && next.tab !== TAB_RECOMMENDED) params.set('tab', next.tab);
    if (next.status && next.status !== STATUS_ONGOING) params.set('status', next.status);
    if (next.personalized && Number.isFinite(next.limit) && next.limit > 10) {
      params.set('limit', String(next.limit));
    }
    if (next.freeOnly) params.set('free', '1');
    if (Number.isFinite(next.maxPrice) && next.maxPrice < 50000) {
      params.set('maxPrice', String(next.maxPrice));
    }

    const qs = params.toString();
    navigate(qs ? `/result?${qs}` : '/search');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const keyword = searchInput.trim();

    if (keyword) {
      saveActivity({
        actionType: 'search',
        keyword,
        region: selectedRegion !== REGION_ALL ? selectedRegion : null,
        category: selectedCategory !== CATEGORY_ALL ? selectedCategory : null,
      });
    }

    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: selectedDate,
      q: keyword,
      personalized,
      tab,
      status,
      limit,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  const goToDetail = (item) => navigate(`/detail/${item.id}`);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data;

        if (personalized) {
          const recommendData = await authFetch(
            tab === TAB_ENDING_SOON
              ? `/api/recommend/personalized/ending-soon?limit=${limit}`
              : `/api/recommend/personalized?limit=${limit}`
          );
          const recommendList = Array.isArray(recommendData) ? recommendData : [];

          if (recommendList.length > 0) {
            const summaryResponse = await axios.get('http://localhost:8080/api/festivals/summaries', {
              params: { ids: recommendList.map((item) => item.id) },
              paramsSerializer: {
                serialize: (params) =>
                  (params.ids || []).map((festivalId) => `ids=${encodeURIComponent(festivalId)}`).join('&'),
              },
            });
            data = summaryResponse.data;
          } else {
            data = [];
          }
        } else {
          data = (await axios.get(`http://localhost:8080/api/festivals${search || ''}`)).data;
        }

        const normalized = Array.isArray(data) ? data.map(normalizeFestival) : [];
        setFestivals(normalized);
      } catch (error) {
        console.error('검색 결과 로딩 실패:', error);
        setFestivals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, personalized, tab, limit]);

  const displayedFestivals = useMemo(() => {
    const today = todayDate();
    const twoWeeksLater = addDays(today, 14);
    const keyword = q.trim().toLowerCase();

    let next = festivals.filter((item) => {
      const title = String(item.title || '').toLowerCase();
      const location = String(item.location || '').toLowerCase();
      const regionText = String(item.region || '').toLowerCase();
      const categoryText = String(item.category || '').toLowerCase();
      const start = parseFestivalDate(item.start_date);
      const end = parseFestivalDate(item.end_date);
      const itemPrice = getPriceNumber(item.price);

      if (selectedRegion !== REGION_ALL && !String(item.region || '').includes(selectedRegion)) return false;
      if (selectedCategory !== CATEGORY_ALL && !categoryText.includes(String(selectedCategory).toLowerCase())) return false;
      if (keyword && !`${title} ${location} ${regionText}`.includes(keyword)) return false;
      if (selectedDate) {
        const target = parseFestivalDate(selectedDate);
        if (target && start && end) {
          if (target < start || target > end) return false;
        }
      }
      if (freeOnlyState && !isFreeFestival(item)) return false;
      if (!freeOnlyState && itemPrice > maxPriceState) return false;
      if (!personalized && status === STATUS_PAST && end && end >= today) return false;
      if (!personalized && status === STATUS_ONGOING && end && end < today) return false;
      if (!personalized && status === STATUS_ENDING_SOON) {
        if (!end || end < today || end > twoWeeksLater) return false;
      }
      if (personalized && tab === TAB_ENDING_SOON) {
        if (!end || end < today || end > twoWeeksLater) return false;
      }
      return true;
    });

    next = next.slice();

    if (sortMode === 'latest') {
      next.sort((a, b) => String(b.start_date || '').localeCompare(String(a.start_date || '')));
    } else if (sortMode === 'popular') {
      next.sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0));
    }

    return next;
  }, [festivals, selectedRegion, selectedCategory, q, selectedDate, freeOnlyState, maxPriceState, personalized, tab, status, sortMode]);

  const buildRecommendReason = (item) => {
    const reasonParts = [];

    if (selectedRegion !== REGION_ALL && item.region?.includes(selectedRegion)) {
      reasonParts.push(`${selectedRegion} 지역 조건과 잘 맞는 행사예요`);
    }
    if (freeOnlyState) {
      reasonParts.push('무료 조건에 맞아서 부담 없이 보기 좋아요');
    } else if (maxPriceState < 50000) {
      reasonParts.push(`${Number(maxPriceState).toLocaleString()}원 이하 예산으로 보기 좋은 편이에요`);
    }
    if (selectedCategory !== CATEGORY_ALL) {
      const rawCategory = String(item.category || item.contentType || '').toLowerCase();
      if (rawCategory.includes(String(selectedCategory).toLowerCase())) {
        reasonParts.push(`${selectedCategory} 카테고리 조건에도 잘 맞아요`);
      }
    }
    if (q) {
      const title = String(item.title || '').toLowerCase();
      const location = String(item.location || '').toLowerCase();
      const keyword = String(q).toLowerCase();
      if (title.includes(keyword) || location.includes(keyword)) {
        reasonParts.push('검색어와 잘 맞는 행사예요');
      }
    }
    if ((item.review_count ?? 0) > 0) reasonParts.push('다른 사용자 반응도 있는 행사예요');
    if ((item.party_count ?? 0) > 0) reasonParts.push('함께 갈 사람을 찾을 수 있는 파티가 있어요');
    if (tab === TAB_ENDING_SOON) reasonParts.push('곧 종료되는 행사라 이번 기회에 보기 좋아요');
    if (status === STATUS_PAST) reasonParts.push('이미 종료된 행사 기록이에요');
  };

  const buildFeatureBadges = (item) => {
    const badges = [];
    const title = String(item.title || '').toLowerCase();
    const location = String(item.location || '').toLowerCase();
    const regionText = String(item.region || '').toLowerCase();
    const categoryText = String(item.category || item.contentType || '').toLowerCase();
    const combined = `${title} ${location} ${regionText} ${categoryText}`;

    if (item.popular) badges.push('인기');
    if ((item.party_count ?? 0) > 0) badges.push('파티 모집중');
    if (combined.includes('청년') || combined.includes('학생') || combined.includes('문화카드')) badges.push('할인 가능');
    if (tab === TAB_ENDING_SOON) badges.push('곧 종료');
    if (status === STATUS_PAST) badges.push('종료됨');
    return [...new Set(badges)].slice(0, 3);
  };

  const renderBadges = (item) => {
    const badges = buildFeatureBadges(item);
    if (badges.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {badges.map((badge) => (
          <span
            key={badge}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#ff5c8a',
              background: '#fff1f6',
              border: '1px solid #ffd3e1',
              borderRadius: 999,
              padding: '4px 8px',
            }}
          >
            {badge}
          </span>
        ))}
      </div>
    );
  };

  const goToPartyList = (item) => {
    saveActivity({
      actionType: 'party_click',
      festivalId: item.id,
      region: item.region,
      category: item.category,
      keyword: q || searchInput || '',
    });
    navigate(`/party?festivalId=${item.id}&festivalTitle=${encodeURIComponent(item.title)}`);
  };

  const goToPartyWrite = (item) => {
    navigate(`/party/write?festivalId=${item.id}&festivalTitle=${encodeURIComponent(item.title)}`);
  };

  const onChangeRegion = (e) => {
    const value = e.target.value;
    setSelectedRegion(value);
    pushQuery({ region: value, category: selectedCategory, date: selectedDate, q, personalized, tab, status, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
  };

  const onChangeCategory = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    pushQuery({ region: selectedRegion, category: value, date: selectedDate, q, personalized, tab, status, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
  };

  const onChangeDateMode = (mode) => {
    setDateMode(mode);
    if (mode === DATE_MODE_ALL) {
      setSelectedDate('');
      pushQuery({ region: selectedRegion, category: selectedCategory, date: '', q, personalized, tab, status, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
      return;
    }
    if (mode === DATE_MODE_TODAY) {
      const newDate = formatInputDate(todayDate());
      setSelectedDate(newDate);
      pushQuery({ region: selectedRegion, category: selectedCategory, date: newDate, q, personalized, tab, status, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
      return;
    }
    if (mode === DATE_MODE_WEEK) {
      const newDate = formatInputDate(todayDate());
      setSelectedDate(newDate);
      pushQuery({ region: selectedRegion, category: selectedCategory, date: newDate, q, personalized, tab, status, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
    }
  };

  const onChangeDateInput = (e) => {
    const value = e.target.value;
    setSelectedDate(value);
    setDateMode(DATE_MODE_CUSTOM);
    pushQuery({ region: selectedRegion, category: selectedCategory, date: value, q, personalized, tab, status, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
  };

  const onToggleFreeOnly = (e) => {
    const checked = e.target.checked;
    setFreeOnlyState(checked);
    pushQuery({ region: selectedRegion, category: selectedCategory, date: selectedDate, q, personalized, tab, status, limit, freeOnly: checked, maxPrice: maxPriceState });
  };

  const onChangeMaxPrice = (e) => setMaxPriceState(Number(e.target.value));

  const applyMaxPrice = (value) => {
    pushQuery({ region: selectedRegion, category: selectedCategory, date: selectedDate, q, personalized, tab, status, limit, freeOnly: freeOnlyState, maxPrice: value });
  };

  const onReset = () => {
    navigate(personalized ? '/result?personalized=1&limit=10' : '/search');
  };

  const openRecommendTab = (nextTab) => {
    pushQuery({ region: selectedRegion, category: selectedCategory, date: selectedDate, q, personalized: true, tab: nextTab, status: STATUS_ONGOING, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
  };

  const openFestivalStatus = (nextStatus) => {
    pushQuery({ region: selectedRegion, category: selectedCategory, date: selectedDate, q, personalized: false, tab: TAB_RECOMMENDED, status: nextStatus, limit, freeOnly: freeOnlyState, maxPrice: maxPriceState });
  };

  const applyRecommendationLimit = () => {
    const parsedLimit = Number(recommendationLimitInput);
    const safeLimit = Math.min(200, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 10));

    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: selectedDate,
      q,
      personalized: true,
      tab,
      status: STATUS_ONGOING,
      limit: safeLimit,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  const countLabel = personalized
    ? tab === TAB_ENDING_SOON
      ? `곧 끝나는 문화행사 ${displayedFestivals.length}개`
      : `내 기록 기반 추천 ${displayedFestivals.length}개`
    : status === STATUS_PAST
      ? `지난 문화행사 ${displayedFestivals.length}개`
      : status === STATUS_ENDING_SOON
        ? `곧 끝나는 문화행사 ${displayedFestivals.length}개`
        : `진행 중 문화행사 ${displayedFestivals.length}개`;

  return (
    <div className="search-page-wrapper">
      <aside className="sidebar">
        <div className="filter-box">
          <label className="checkbox-label">
            <input type="checkbox" checked={freeOnlyState} onChange={onToggleFreeOnly} />
            무료만 보기
          </label>

          <div className="filter-group">
            <h3>가격 범위</h3>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>0원 ~ {formatWon(maxPriceState)}</p>
            <input
              type="range"
              className="range-slider"
              min={0}
              max={50000}
              step={1000}
              value={maxPriceState}
              disabled={freeOnlyState}
              onChange={onChangeMaxPrice}
              onMouseUp={(e) => applyMaxPrice(Number(e.currentTarget.value))}
              onTouchEnd={(e) => applyMaxPrice(Number(e.currentTarget.value))}
            />
            <div className="range-labels">
              <span>0원</span>
              <span>50,000원</span>
            </div>
          </div>

          <div className="filter-group">
            <h3>지역</h3>
            <select className="filter-select" value={selectedRegion} onChange={onChangeRegion}>
              {regionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>현재 선택: {selectedRegion}</p>
          </div>

          <div className="filter-group">
            <h3>기간</h3>
            <div className="radio-group">
              <label><input type="radio" name="dateMode" checked={dateMode === DATE_MODE_ALL} onChange={() => onChangeDateMode(DATE_MODE_ALL)} />전체</label>
              <label><input type="radio" name="dateMode" checked={dateMode === DATE_MODE_TODAY} onChange={() => onChangeDateMode(DATE_MODE_TODAY)} />오늘</label>
              <label><input type="radio" name="dateMode" checked={dateMode === DATE_MODE_WEEK} onChange={() => onChangeDateMode(DATE_MODE_WEEK)} />이번 주</label>
            </div>
            <div style={{ marginTop: 10 }}>
              <input type="date" value={selectedDate || ''} onChange={onChangeDateInput} style={{ width: '100%' }} />
              <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>현재 날짜 조건: {selectedDate || '없음'}</p>
            </div>
          </div>

          <div className="filter-group">
            <h3>카테고리</h3>
            <select className="filter-select" value={selectedCategory} onChange={onChangeCategory}>
              {categoryOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>현재 선택: {selectedCategory}</p>
          </div>

          {q && (
            <div className="filter-group">
              <h3>키워드</h3>
              <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>현재 키워드: "{q}"</p>
            </div>
          )}

          <button className="reset-btn" onClick={onReset}>필터 초기화</button>
        </div>
      </aside>

      <main className="search-content">
        <div style={{ marginBottom: 20, padding: 18, borderRadius: 16, background: '#fff', border: '1px solid #eee', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>검색</div>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="축제명, 지역, 장소로 검색"
              style={{ flex: 1, minWidth: 240, padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd' }}
            />
            <button type="submit" style={{ padding: '12px 18px', border: 'none', borderRadius: 10, background: '#ff5c8a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              검색
            </button>
          </form>
          <p style={{ fontSize: 12, color: '#888', marginTop: 8, marginBottom: 0 }}>지역, 행사명, 장소 키워드로 원하는 축제를 찾아보세요.</p>
        </div>

        <div className="content-header">
          <span className="total-count">{countLabel}</span>
          <select className="sort-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="recommend">추천순</option>
            <option value="popular">인기순</option>
            <option value="latest">최신순</option>
          </select>
        </div>

        <div style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>
          {personalized
            ? tab === TAB_ENDING_SOON
              ? '취향 분석에 맞는 추천 중에서 종료가 2주 이내로 남은 행사만 모아봤어요.'
              : '최근 검색, 상세조회, 좋아요, 방문 기록을 반영한 추천 결과입니다.'
            : status === STATUS_PAST
              ? '이미 종료된 문화행사를 다시 찾아볼 수 있어요.'
              : status === STATUS_ENDING_SOON
                ? '종료일까지 2주 이내로 남은 문화행사만 모아봤어요.'
              : `적용 조건: ${selectedRegion} / ${selectedCategory}${selectedDate ? ` / ${selectedDate}` : ''}${q ? ` / "${q}"` : ''}${freeOnlyState ? ' / 무료만' : ` / 0원 ~ ${formatWon(maxPriceState)}`}`}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {personalized ? (
            <>
              <button type="button" onClick={() => openRecommendTab(TAB_RECOMMENDED)} style={{ padding: '8px 14px', borderRadius: 999, border: tab === TAB_RECOMMENDED ? '1px solid #ff7aa3' : '1px solid #e5e7eb', background: tab === TAB_RECOMMENDED ? '#fff1f6' : '#fff', color: tab === TAB_RECOMMENDED ? '#ff5c8a' : '#6b7280', fontWeight: 700, cursor: 'pointer' }}>내 기록 기반 추천</button>
              <button type="button" onClick={() => openRecommendTab(TAB_ENDING_SOON)} style={{ padding: '8px 14px', borderRadius: 999, border: tab === TAB_ENDING_SOON ? '1px solid #ff7aa3' : '1px solid #e5e7eb', background: tab === TAB_ENDING_SOON ? '#fff1f6' : '#fff', color: tab === TAB_ENDING_SOON ? '#ff5c8a' : '#6b7280', fontWeight: 700, cursor: 'pointer' }}>곧 끝나는 문화행사</button>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, border: '1px solid #f2d6e2', background: '#fff' }}>
                <span style={{ color: '#6b7280', fontSize: 13 }}>추천 개수</span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={recommendationLimitInput}
                  onChange={(e) => setRecommendationLimitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyRecommendationLimit();
                    }
                  }}
                  style={{
                    width: 64,
                    height: 30,
                    borderRadius: 8,
                    border: '1px solid #f2d6e2',
                    padding: '0 8px',
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={applyRecommendationLimit}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 999,
                    border: '1px solid #ffd3e1',
                    background: '#fff4f8',
                    color: '#ff5c8a',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  적용
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={() => openFestivalStatus(STATUS_ONGOING)} style={{ padding: '8px 14px', borderRadius: 999, border: status === STATUS_ONGOING ? '1px solid #ff7aa3' : '1px solid #e5e7eb', background: status === STATUS_ONGOING ? '#fff1f6' : '#fff', color: status === STATUS_ONGOING ? '#ff5c8a' : '#6b7280', fontWeight: 700, cursor: 'pointer' }}>진행 중 문화행사</button>
              <button type="button" onClick={() => openFestivalStatus(STATUS_ENDING_SOON)} style={{ padding: '8px 14px', borderRadius: 999, border: status === STATUS_ENDING_SOON ? '1px solid #ff7aa3' : '1px solid #e5e7eb', background: status === STATUS_ENDING_SOON ? '#fff1f6' : '#fff', color: status === STATUS_ENDING_SOON ? '#ff5c8a' : '#6b7280', fontWeight: 700, cursor: 'pointer' }}>곧 끝나는 문화행사</button>
              <button type="button" onClick={() => openFestivalStatus(STATUS_PAST)} style={{ padding: '8px 14px', borderRadius: 999, border: status === STATUS_PAST ? '1px solid #ff7aa3' : '1px solid #e5e7eb', background: status === STATUS_PAST ? '#fff1f6' : '#fff', color: status === STATUS_PAST ? '#ff5c8a' : '#6b7280', fontWeight: 700, cursor: 'pointer' }}>지난 문화행사 보기</button>
            </>
          )}
        </div>

        {loading ? (
          <p>로딩 중...</p>
        ) : displayedFestivals.length === 0 ? (
          <p>{personalized && tab === TAB_ENDING_SOON ? '곧 끝나는 추천 행사가 아직 없어요.' : !personalized && status === STATUS_ENDING_SOON ? '2주 이내에 종료되는 문화행사가 아직 없어요.' : '검색 결과가 없습니다.'}</p>
        ) : (
          <>
            <div className="modern-grid">
              {displayedFestivals.map((item) => (
                <div key={item.id} className="modern-card-link">
                  <div className="modern-card">
                    <div onClick={() => goToDetail(item)} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <div className="card-image-area">
                        {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} /> : <div className="no-image-placeholder" />}
                      </div>
                    </div>

                    <div className="card-info-area">
                      {renderBadges(item)}
                      <h3 className="card-title" onClick={() => goToDetail(item)} style={{ cursor: 'pointer' }}>{item.title}</h3>
                      <p className="card-date">{formatDate(item.start_date)} - {formatDate(item.end_date)}</p>
                    <p className="card-location">{formatPlace(item.region, item.location)}</p>

                    <p style={{ fontSize: 12, color: '#999', margin: '6px 0 10px', lineHeight: 1.5 }}>{buildRecommendReason(item)}</p>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <button type="button" onClick={() => goToPartyList(item)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ffd3e1', background: '#fff4f8', color: '#ff5c8a', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>관련 파티 보기</button>
                        <button type="button" onClick={() => goToPartyWrite(item)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ffd3e1', background: '#fff', color: '#ff5c8a', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>파티 만들기</button>
                      </div>

                      <div className="card-bottom-row">
                        <div className="card-stats">
                          <span>★ {item.review_count > 0 ? Number(item.rating_avg).toFixed(1) : '-'}</span>
                          <span>조회 {item.view_count ?? 0}</span>
                          <span>좋아요 {item.like_count ?? 0}</span>
                          <span>리뷰 {item.review_count ?? 0}</span>
                          <span>파티 {item.party_count ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Search;
