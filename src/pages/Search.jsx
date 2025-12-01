import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

// 더미 축제 데이터 (나중에 API로 교체)
const FESTIVALS = [
  {
    id: 1,
    title: '뮤지컬 <위키드> 내한공연',
    region: '서울',
    category: '공연',
    period: '11.20 - 1.31',
    place: '샤롯데씨어터',
    price: 45000,
    priceLabel: '45,000원',
    rating: 4.9,
    reviews: 887,
    partyCount: 15,
    badge: '학생 할인',
  },
  {
    id: 2,
    title: '팀랩 플래닛: 몰입형 미디어 아트',
    region: '서울',
    category: '전시',
    period: '10.15 - 2.28',
    place: '코엑스 아티움',
    price: 25000,
    priceLabel: '25,000원',
    rating: 4.8,
    reviews: 542,
    partyCount: 12,
    badge: '학생 할인',
  },
  {
    id: 3,
    title: '인상주의 걸작전: 모네에서 세잔까지',
    region: '서울',
    category: '전시',
    period: '11.10 - 3.15',
    place: '국립중앙박물관',
    price: 18000,
    priceLabel: '18,000원',
    rating: 4.7,
    reviews: 421,
    partyCount: 8,
    badge: '학생 할인',
  },
  {
    id: 4,
    title: '서울 도자기 체험 워크숍',
    region: '경기',
    category: '체험',
    period: '11.15 - 1.15',
    place: '익선동 공방',
    price: 35000,
    priceLabel: '35,000원',
    rating: 4.6,
    reviews: 156,
    partyCount: 7,
    badge: '학생 할인',
  },
  {
    id: 5,
    title: '서울 빛초롱 축제 2024',
    region: '서울',
    category: '축제',
    period: '11.1 - 12.31',
    place: '청계천 일대',
    price: 0,
    priceLabel: '무료',
    rating: 4.5,
    reviews: 328,
    partyCount: 5,
    badge: '학생 할인',
  },
  {
    id: 6,
    title: '현대미술의 새로운 시각',
    region: '서울',
    category: '전시',
    period: '11.5 - 2.20',
    place: '리움미술관',
    price: 12000,
    priceLabel: '12,000원',
    rating: 4.5,
    reviews: 289,
    partyCount: 6,
    badge: '학생 할인',
  },
]

const CATEGORY_OPTIONS = ['전시', '공연', '축제', '체험', '기타']

export default function Search() {
  const [freeOnly, setFreeOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState(50000)
  const [region, setRegion] = useState('전체')
  const [period, setPeriod] = useState('전체')
  const [selectedCategories, setSelectedCategories] = useState([])

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    )
  }

  const handleReset = () => {
    setFreeOnly(false)
    setMaxPrice(50000)
    setRegion('전체')
    setPeriod('전체')
    setSelectedCategories([])
  }

  const filteredFestivals = useMemo(() => {
    return FESTIVALS.filter((f) => {
      if (freeOnly && f.price > 0) return false
      if (f.price > maxPrice) return false
      if (region !== '전체' && f.region !== region) return false

      // 카테고리: 아무것도 안 눌렀으면 전체, 선택 있으면 그 중에서만
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(f.category)
      ) {
        return false
      }

      // 기간 필터는 UI만 있고 아직 실제 로직 없음 (나중에 추가 가능)
      return true
    })
  }, [freeOnly, maxPrice, region, selectedCategories, period])

  return (
    <div className="search-page">
      <h1 className="page-title">축제 탐색</h1>

      <div className="search-layout">
        {/* 왼쪽 필터 박스 */}
        <aside className="search-filters">
          <div className="filter-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
              />
              <span>무료만 보기</span>
            </label>
          </div>

          <div className="filter-group">
            <div className="filter-label">가격 범위</div>
            <input
              type="range"
              min={0}
              max={50000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="price-range"
            />
            <div className="price-range-labels">
              <span>0원</span>
              <span>50,000원</span>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">지역</div>
            <select
              className="filter-select"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="전체">전체</option>
              <option value="서울">서울</option>
              <option value="경기">경기</option>
              <option value="인천">인천</option>
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-label">기간</div>
            <div className="filter-radio-group">
              {['전체', '오늘', '이번 주', '이번 달', '날짜 직접 선택'].map(
                (label) => (
                  <label key={label} className="filter-radio">
                    <input
                      type="radio"
                      name="period"
                      value={label}
                      checked={period === label}
                      onChange={(e) => setPeriod(e.target.value)}
                    />
                    <span>{label}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">카테고리</div>
            <div className="filter-checkbox-group">
              {CATEGORY_OPTIONS.map((cat) => (
                <label key={cat} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="filter-reset" onClick={handleReset}>
            필터 초기화
          </button>
        </aside>

        {/* 오른쪽 카드 그리드 */}
        <section className="search-results">
          <div className="search-results-header">
            <span>총 {filteredFestivals.length}개 결과</span>
            <select className="filter-select small">
              <option>추천순</option>
              <option>가격 낮은순</option>
              <option>가격 높은순</option>
            </select>
          </div>

          <div className="search-grid">
            {filteredFestivals.map((f) => (
              <Link
                key={f.id}
                to={`/detail/${f.id}`}
                className="search-card"
              >
                <div className="search-card-thumb" />
                <div className="search-card-body">
                  <div className="search-card-header">
                    <span className="search-card-category">{f.category}</span>
                    {f.badge && (
                      <span className="search-card-badge">{f.badge}</span>
                    )}
                  </div>

                  <h3 className="search-card-title">{f.title}</h3>

                  <div className="search-card-meta">
                    <span>{f.period}</span>
                    <span>{f.place}</span>
                  </div>

                  <div className="search-card-footer">
                    <div className="search-card-price">{f.priceLabel}</div>
                    <div className="search-card-sub">
                      <span>
                        ⭐ {f.rating.toFixed(1)} ({f.reviews})
                      </span>
                      <span>👥 파티 {f.partyCount}건</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {filteredFestivals.length === 0 && (
              <div className="search-empty">
                조건에 맞는 축제가 없어요 🥲
                <br />
                필터를 조금 풀어보는 건 어떨까요?
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
