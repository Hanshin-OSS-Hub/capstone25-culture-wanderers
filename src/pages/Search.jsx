import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Search = () => {
  const { search } = useLocation();
  const navigate = useNavigate();

  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const parsed = useMemo(() => {
    const params = new URLSearchParams(search);

    const freeOnly = params.get('free') === '1';
    const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : 50000;

    return {
      q: params.get('q') || '',
      region: params.get('region') || '전체',
      date: params.get('date') || '',
      category: params.get('category') || '전체',
      freeOnly,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : 50000,
    };
  }, [search]);

  const { q, region, date, category, freeOnly, maxPrice } = parsed;

  const [selectedRegion, setSelectedRegion] = useState(region);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [dateMode, setDateMode] = useState('전체');
  const [selectedDate, setSelectedDate] = useState(date);
  const [freeOnlyState, setFreeOnlyState] = useState(freeOnly);
  const [maxPriceState, setMaxPriceState] = useState(maxPrice);

  useEffect(() => {
    setSelectedRegion(region);
    setSelectedCategory(category);
    setSelectedDate(date);

    if (!date) setDateMode('전체');
    else setDateMode('특정날짜');

    setFreeOnlyState(freeOnly);
    setMaxPriceState(maxPrice);
  }, [region, category, date, freeOnly, maxPrice]);

  useEffect(() => {
    setSearchInput(q || '');
  }, [q]);

  const pad2 = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const getToday = () => toYMD(new Date());
  const getThisWeekRepresentative = () => toYMD(new Date());

  const pushQuery = (next) => {
    const params = new URLSearchParams();

    if (next.region && next.region !== '전체') params.set('region', next.region);
    if (next.category && next.category !== '전체') params.set('category', next.category);
    if (next.date) params.set('date', next.date);
    if (next.q && next.q.trim() !== '') params.set('q', next.q.trim());

    if (next.freeOnly) params.set('free', '1');
    if (Number.isFinite(next.maxPrice) && next.maxPrice < 50000) {
      params.set('maxPrice', String(next.maxPrice));
    }

    const qs = params.toString();
    navigate(qs ? `/result?${qs}` : '/search');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: selectedDate,
      q: searchInput,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  const normalizeFestival = (item) => ({
    ...item,
    thumbnail_url: item.thumbnail_url ?? item.thumbnailUrl ?? '',
    start_date: item.start_date ?? item.startDate ?? '',
    end_date: item.end_date ?? item.endDate ?? '',
    homepage_url: item.homepage_url ?? item.homepageUrl ?? '',
    review_count: item.review_count ?? item.reviewCount ?? 0,
    party_count: item.party_count ?? item.partyCount ?? 0,
    rating_avg: item.rating_avg ?? item.ratingAvg ?? 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const hasQuery = search && search.trim() !== '';
        const url = hasQuery
          ? `http://localhost:3000/api/festivals/search${search}`
          : 'http://localhost:3000/api/festivals';

        const response = await axios.get(url);
        const normalFestivals = Array.isArray(response.data)
          ? response.data.map(normalizeFestival)
          : [];

        setFestivals(normalFestivals);
      } catch (error) {
        console.error('에러:', error);
        setFestivals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const raw = String(dateString);

    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
    }

    const datePart = raw.split('T')[0];
    return datePart.replace(/-/g, '.');
  };

  const formatWon = (n) => `${Number(n).toLocaleString()}원`;

  const buildRecommendReason = (item) => {
    const reasonParts = [];

    if (selectedRegion !== '전체' && item.region?.includes(selectedRegion)) {
      reasonParts.push(`${selectedRegion} 지역 조건에 잘 맞아요`);
    }

    if (freeOnlyState) {
      reasonParts.push('무료 조건에 맞춰 부담 없이 볼 수 있어요');
    } else if (maxPriceState < 50000) {
      reasonParts.push(`${Number(maxPriceState).toLocaleString()}원 이하 예산으로 보기 좋은 편이에요`);
    }

    if (selectedCategory !== '전체') {
      const rawCategory = String(item.category || item.contentType || '').toLowerCase();
      if (rawCategory.includes(String(selectedCategory).toLowerCase())) {
        reasonParts.push(`${selectedCategory} 카테고리 조건에도 맞아요`);
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

    if ((item.review_count ?? 0) > 0) {
      reasonParts.push('다른 사용자 반응도 있는 편이에요');
    }

    if ((item.party_count ?? 0) > 0) {
      reasonParts.push('같이 갈 사람을 찾는 파티도 있어요');
    }

    if (reasonParts.length === 0) {
      reasonParts.push('입력한 조건과 전반적으로 잘 맞는 행사예요');
    }

    return reasonParts[0];
  };

  const buildFeatureBadges = (item) => {
    const badges = [];

    const title = String(item.title || '').toLowerCase();
    const location = String(item.location || '').toLowerCase();
    const regionText = String(item.region || '').toLowerCase();
    const categoryText = String(item.category || item.contentType || '').toLowerCase();

    const combined = `${title} ${location} ${regionText} ${categoryText}`;

    if ((item.review_count ?? 0) >= 3 || ((item.rating_avg ?? 0) >= 4.0 && (item.review_count ?? 0) > 0)) {
      badges.push('인기');
    }

    if ((item.party_count ?? 0) > 0) {
      badges.push('파티 모집중');
    }

    if (
      combined.includes('할인') ||
      combined.includes('학생') ||
      combined.includes('청년') ||
      combined.includes('패스') ||
      combined.includes('문화카드')
    ) {
      badges.push('학생 할인 가능');
    }

    if (
      combined.includes('야외') ||
      combined.includes('공원') ||
      combined.includes('광장') ||
      combined.includes('축제') ||
      combined.includes('거리') ||
      combined.includes('마당')
    ) {
      badges.push('실외');
    }

    return badges.slice(0, 3);
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
    navigate(`/party?festivalId=${item.id}&festivalTitle=${encodeURIComponent(item.title)}`);
  };

  const goToPartyWrite = (item) => {
    navigate(`/party/write?festivalId=${item.id}&festivalTitle=${encodeURIComponent(item.title)}`);
  };

  const onChangeRegion = (e) => {
    const value = e.target.value;
    setSelectedRegion(value);

    pushQuery({
      region: value,
      category: selectedCategory,
      date: selectedDate,
      q,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  const onChangeCategory = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);

    pushQuery({
      region: selectedRegion,
      category: value,
      date: selectedDate,
      q,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  const onChangeDateMode = (mode) => {
    setDateMode(mode);

    if (mode === '전체') {
      setSelectedDate('');
      pushQuery({
        region: selectedRegion,
        category: selectedCategory,
        date: '',
        q,
        freeOnly: freeOnlyState,
        maxPrice: maxPriceState,
      });
      return;
    }

    if (mode === '오늘') {
      const newDate = getToday();
      setSelectedDate(newDate);
      pushQuery({
        region: selectedRegion,
        category: selectedCategory,
        date: newDate,
        q,
        freeOnly: freeOnlyState,
        maxPrice: maxPriceState,
      });
      return;
    }

    if (mode === '이번주') {
      const newDate = getThisWeekRepresentative();
      setSelectedDate(newDate);
      pushQuery({
        region: selectedRegion,
        category: selectedCategory,
        date: newDate,
        q,
        freeOnly: freeOnlyState,
        maxPrice: maxPriceState,
      });
    }
  };

  const onChangeDateInput = (e) => {
    const value = e.target.value;
    setSelectedDate(value);
    setDateMode('특정날짜');

    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: value,
      q,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  const onToggleFreeOnly = (e) => {
    const checked = e.target.checked;
    setFreeOnlyState(checked);

    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: selectedDate,
      q,
      freeOnly: checked,
      maxPrice: maxPriceState,
    });
  };

  const onChangeMaxPrice = (e) => {
    const value = Number(e.target.value);
    setMaxPriceState(value);
  };

  const applyMaxPrice = (value) => {
    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: selectedDate,
      q,
      freeOnly: freeOnlyState,
      maxPrice: value,
    });
  };

  const onReset = () => {
    navigate('/search');
  };

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

            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              0원 ~ {formatWon(maxPriceState)}
            </p>

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

            {freeOnlyState && (
              <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                무료만 보기 활성화 시 가격 범위는 적용되지 않습니다.
              </p>
            )}
          </div>

          <div className="filter-group">
            <h3>지역</h3>
            <select className="filter-select" value={selectedRegion} onChange={onChangeRegion}>
              <option>전체</option>
              <option>서울</option>
              <option>경기</option>
              <option>부산</option>
              <option>인천</option>
              <option>대구</option>
              <option>광주</option>
              <option>대전</option>
              <option>울산</option>
              <option>강원</option>
              <option>충북</option>
              <option>충남</option>
              <option>전북</option>
              <option>전남</option>
              <option>경북</option>
              <option>경남</option>
              <option>제주</option>
            </select>
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
              현재 선택: {selectedRegion}
            </p>
          </div>

          <div className="filter-group">
            <h3>기간</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="dateMode"
                  checked={dateMode === '전체'}
                  onChange={() => onChangeDateMode('전체')}
                />
                전체
              </label>
              <label>
                <input
                  type="radio"
                  name="dateMode"
                  checked={dateMode === '오늘'}
                  onChange={() => onChangeDateMode('오늘')}
                />
                오늘
              </label>
              <label>
                <input
                  type="radio"
                  name="dateMode"
                  checked={dateMode === '이번주'}
                  onChange={() => onChangeDateMode('이번주')}
                />
                이번 주
              </label>
            </div>

            <div style={{ marginTop: 10 }}>
              <input
                type="date"
                value={selectedDate || ''}
                onChange={onChangeDateInput}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                현재 날짜 조건: {selectedDate || '없음'}
              </p>
            </div>
          </div>

          <div className="filter-group">
            <h3>카테고리</h3>
            <select className="filter-select" value={selectedCategory} onChange={onChangeCategory}>
              <option>전체</option>
              <option>전시</option>
              <option>공연</option>
              <option>축제</option>
              <option>체험</option>
            </select>
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
              현재 선택: {selectedCategory}
            </p>
          </div>

          {q && (
            <div className="filter-group">
              <h3>키워드</h3>
              <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                현재 키워드: "{q}"
              </p>
            </div>
          )}

          <button className="reset-btn" onClick={onReset}>
            필터 초기화
          </button>
        </div>
      </aside>

      <main className="search-content">
        <div
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 16,
            background: '#fff',
            border: '1px solid #eee',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
            검색
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="축제명, 지역, 장소로 검색"
              style={{
                flex: 1,
                minWidth: 240,
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #ddd',
              }}
            />

            <button
              type="submit"
              style={{
                padding: '12px 18px',
                border: 'none',
                borderRadius: 10,
                background: '#ff5c8a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              검색
            </button>
          </form>

          <p style={{ fontSize: 12, color: '#888', marginTop: 8, marginBottom: 0 }}>
            지역, 행사명, 장소 키워드로 원하는 축제를 찾아보세요.
          </p>
        </div>

        <div className="content-header">
          <span className="total-count">총 {festivals.length}개 결과</span>
          <select className="sort-select">
            <option>추천순</option>
            <option>인기순</option>
            <option>최신순</option>
          </select>
        </div>

        {(selectedRegion !== '전체' ||
          selectedCategory !== '전체' ||
          selectedDate ||
          q ||
          freeOnlyState ||
          maxPriceState < 50000) && (
          <div style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>
            적용 조건: {selectedRegion} / {selectedCategory}
            {selectedDate ? ` / ${selectedDate}` : ''}
            {q ? ` / "${q}"` : ''}
            {freeOnlyState ? ` / 무료만` : ` / 0원~${formatWon(maxPriceState)}`}
          </div>
        )}

        {loading ? (
          <p>로딩 중...</p>
        ) : festivals.length === 0 ? (
          <p>검색 결과가 없습니다.</p>
        ) : (
          <div className="modern-grid">
            {festivals.map((item) => (
              <div key={item.id} className="modern-card-link">
                <div className="modern-card">
                  <Link to={`/detail/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card-image-area">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} />
                      ) : (
                        <div className="no-image-placeholder" />
                      )}
                    </div>
                  </Link>

                  <div className="card-info-area">
                    {renderBadges(item)}

                    <Link to={`/detail/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 className="card-title">{item.title}</h3>
                    </Link>

                    <p className="card-date">
                      {formatDate(item.start_date)} - {formatDate(item.end_date)}
                    </p>

                    <p className="card-location">
                      {item.region} {item.location}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                        fontSize: 12,
                        color: '#666',
                        margin: '8px 0',
                      }}
                    >
                      <span>리뷰 {item.review_count ?? 0}건</span>
                      <span>파티 {item.party_count ?? 0}개</span>
                    </div>

                    <p style={{ fontSize: 12, color: '#999', margin: '6px 0 10px', lineHeight: 1.5 }}>
                      {buildRecommendReason(item)}
                    </p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <button
                        type="button"
                        onClick={() => goToPartyList(item)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: '1px solid #ffd3e1',
                          background: '#fff4f8',
                          color: '#ff5c8a',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        관련 파티 보기
                      </button>

                      <button
                        type="button"
                        onClick={() => goToPartyWrite(item)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: '1px solid #ffd3e1',
                          background: '#fff',
                          color: '#ff5c8a',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        파티 만들기
                      </button>
                    </div>

                    <div className="card-bottom-row">
                      <div className="card-stats">
                        <span>
                          ⭐ {item.review_count > 0 ? Number(item.rating_avg).toFixed(1) : '-'}
                        </span>
                        <span>리뷰 {item.review_count ?? 0}</span>
                        <span>파티 {item.party_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;