import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Search = () => {
  const { search } = useLocation(); // ?region=...&date=...&category=...&q=...&free=1&maxPrice=...
  const navigate = useNavigate();

  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ URL 쿼리 파싱(변경 감지 안정화 위해 useMemo)
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

  // ✅ 필터 UI 상태(초기값은 URL에서 가져옴)
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [selectedCategory, setSelectedCategory] = useState(category);

  const [dateMode, setDateMode] = useState('전체'); // 전체 | 오늘 | 이번주 | 특정날짜
  const [selectedDate, setSelectedDate] = useState(date); // YYYY-MM-DD

  const [freeOnlyState, setFreeOnlyState] = useState(freeOnly);
  const [maxPriceState, setMaxPriceState] = useState(maxPrice);

  // URL 변경 시 UI 상태도 동기화
  useEffect(() => {
    setSelectedRegion(region);
    setSelectedCategory(category);
    setSelectedDate(date);

    if (!date) setDateMode('전체');
    else setDateMode('특정날짜');

    setFreeOnlyState(freeOnly);
    setMaxPriceState(maxPrice);
  }, [region, category, date, freeOnly, maxPrice]);

  // 날짜 유틸
  const pad2 = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const getToday = () => toYMD(new Date());
  const getThisWeekRepresentative = () => toYMD(new Date());

  // ✅ URL 쿼리 생성 및 이동
  const pushQuery = (next) => {
    const params = new URLSearchParams();

    if (next.region && next.region !== '전체') params.set('region', next.region);
    if (next.category && next.category !== '전체') params.set('category', next.category);
    if (next.date) params.set('date', next.date);
    if (next.q && next.q.trim() !== '') params.set('q', next.q);

    // ✅ 무료/가격
    if (next.freeOnly) params.set('free', '1');
    // "0원 ~ max"만 쓰는 구조 → maxPrice만 보냄
    if (Number.isFinite(next.maxPrice) && next.maxPrice < 50000) {
      params.set('maxPrice', String(next.maxPrice));
    }

    const qs = params.toString();

    // 기존 구조 유지: 조건 있으면 /result?..., 없으면 /search
    navigate(qs ? `/result?${qs}` : `/search`);
  };

  // ✅ 실제 데이터 호출
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const hasQuery = search && search.trim() !== '';
        const url = hasQuery
          ? `http://localhost:3000/api/festivals/search${search}`
          : `http://localhost:3000/api/festivals`;

        const response = await axios.get(url);
        setFestivals(response.data);
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
    const datePart = dateString.split('T')[0];
    return datePart.replace(/-/g, '.');
  };

  const formatWon = (n) => `${Number(n).toLocaleString()}원`;

  // ✅ 핸들러들
  const onChangeRegion = (e) => {
    const v = e.target.value;
    setSelectedRegion(v);

    pushQuery({
      region: v,
      category: selectedCategory,
      date: selectedDate,
      q,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  const onChangeCategory = (e) => {
    const v = e.target.value;
    setSelectedCategory(v);

    pushQuery({
      region: selectedRegion,
      category: v,
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
      const d = getToday();
      setSelectedDate(d);
      pushQuery({
        region: selectedRegion,
        category: selectedCategory,
        date: d,
        q,
        freeOnly: freeOnlyState,
        maxPrice: maxPriceState,
      });
      return;
    }

    if (mode === '이번주') {
      const d = getThisWeekRepresentative();
      setSelectedDate(d);
      pushQuery({
        region: selectedRegion,
        category: selectedCategory,
        date: d,
        q,
        freeOnly: freeOnlyState,
        maxPrice: maxPriceState,
      });
      return;
    }

    // 특정날짜는 input에서 처리
  };

  const onChangeDateInput = (e) => {
    const v = e.target.value; // YYYY-MM-DD
    setSelectedDate(v);
    setDateMode('특정날짜');

    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: v,
      q,
      freeOnly: freeOnlyState,
      maxPrice: maxPriceState,
    });
  };

  // ✅ 무료만 보기
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

  // ✅ 가격(단일 슬라이더) - 드래그 중 상태만 바꾸고, 드래그 끝에 쿼리 반영
  const onChangeMaxPrice = (e) => {
    const v = Number(e.target.value);
    setMaxPriceState(v);
  };

  const applyMaxPrice = (v) => {
    pushQuery({
      region: selectedRegion,
      category: selectedCategory,
      date: selectedDate,
      q,
      freeOnly: freeOnlyState,
      maxPrice: v,
    });
  };

  const onReset = () => {
    navigate('/search');
  };

  return (
    <div className="search-page-wrapper">
      {/* 1. 왼쪽 사이드바 (필터) */}
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

      {/* 2. 오른쪽 메인 컨텐츠 */}
      <main className="search-content">
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
              <Link to={`/detail/${item.id}`} key={item.id} className="modern-card-link">
                <div className="modern-card">
                  <div className="card-image-area">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.title} />
                    ) : (
                      <div className="no-image-placeholder" />
                    )}
                  </div>

                  <div className="card-info-area">
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-date">
                      {formatDate(item.start_date)} - {formatDate(item.end_date)}
                    </p>
                    <p className="card-location">
                      {item.region} {item.location}
                    </p>

                    <div className="card-bottom-row">
                      <span className="card-price" style={{ color: '#888', fontWeight: 'normal' }}>
                        상세 정보 확인
                      </span>

                      <div className="card-stats">
                        <span>⭐ 4.8</span>
                        <span>👥 12건</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
