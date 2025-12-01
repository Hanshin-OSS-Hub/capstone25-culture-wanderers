import { useParams } from 'react-router-dom'

const FESTIVALS = [
  { id: 1, title: '뮤지컬 <위키드> 내한공연' },
  { id: 2, title: '팀랩 플래닛: 몰입형 미디어 아트' },
  { id: 3, title: '인상주의 걸작전: 모네에서 세잔까지' },
  { id: 4, title: '서울 도자기 체험 워크숍' },
  { id: 5, title: '서울 빛초롱 축제 2024' },
  { id: 6, title: '현대미술의 새로운 시각' },
]

export default function Detail() {
  const { id } = useParams()
  const festival = FESTIVALS.find((f) => String(f.id) === String(id))

  const title = festival?.title || '서울 봄 꽃 축제 2025'

  return (
    <div className="detail-page">
      {/* 메인 카드 */}
      <div className="detail-main-card">
        <div className="detail-top">
          {/* 포스터 영역 */}
          <div className="detail-poster" />

          {/* 오른쪽 정보 영역 */}
          <div className="detail-summary">
            <h1 className="detail-title">{title}</h1>

            <div className="detail-tags">
              <span className="badge-outline light">야외 행사</span>
              <span className="badge-outline light">가족 추천</span>
              <span className="badge-outline light">봄 축제</span>
            </div>

            <dl className="detail-info-list">
              <div>
                <dt>행사 기간</dt>
                <dd>2025년 4월 1일 ~ 4월 12일</dd>
              </div>
              <div>
                <dt>운영 시간</dt>
                <dd>매일 09:00 ~ 21:00</dd>
              </div>
              <div>
                <dt>위치</dt>
                <dd>서울특별시 영등포구 여의도공원로</dd>
              </div>
            </dl>

            {/* 가격 안내 박스 */}
            <div className="detail-price-box">
              <h2>가격 안내</h2>
              <div className="detail-price-row">
                <span>일반 입장</span>
                <span className="price">15,000원</span>
              </div>
              <div className="detail-price-row">
                <span>학생 할인 (20% OFF)</span>
                <span className="price">12,000원</span>
              </div>
              <button className="detail-price-link">
                학생 할인 안내 자세히 보기 →
              </button>
            </div>

            <button className="detail-reserve-btn">예매하기</button>
          </div>
        </div>
      </div>

      {/* 아래 탭 + 내용 카드 */}
      <div className="detail-bottom-card">
        {/* 탭 */}
        <div className="detail-tabs">
          <button className="detail-tab active">정보</button>
          <button className="detail-tab">리뷰</button>
          <button className="detail-tab">파티원 모집</button>
        </div>

        {/* 정보 탭 내용 */}
        <div className="detail-tab-panel">
          <section className="detail-section">
            <h3>행사 소개</h3>
            <p>
              서울의 봄을 만끽할 수 있는 최고의 축제! 여의도 공원 일대가
              벚꽃과 다양한 불꽃으로 가득 채운 대규모 봄 축제입니다. 가족,
              연인, 친구들과 함께 아름다운 봄날을 즐겨 보세요.
            </p>
            <p>
              낮에는 만개한 벚꽃 아래에서 피크닉을, 저녁에는 은은한 조명으로
              물든 야경을 감상하실 수 있습니다. 다양한 먹거리 부스와 공연,
              체험 프로그램도 준비되어 있습니다.
            </p>
          </section>

                <section className="detail-section">
        
        {/* 연핑크 박스로 감싸기 */}
        <div className="detail-soft-box">
            <div className="detail-two-column">
            <div>
                <h3>운영 안내</h3>
                <p>주간 운영</p>
                <p>09:00 ~ 18:00</p>
                <p>휴무일 없음 (기간 내 매일 운영)</p>
                <p>여의도공원 주차장 이용 가능 (유료)</p>
            </div>
            <div>
                <p>야간 운영</p>
                <p>18:00 ~ 21:00 (조명 점등)</p>
            </div>
            </div>
        </div>
        </section>


          <section className="detail-section">
            <h3>주최 및 문의</h3>
            <ul className="detail-contact-list">
              <li>
                <span className="icon">🏛</span>
                <div>
                  <strong>주최</strong>
                  <p>서울특별시 문화관광국</p>
                </div>
              </li>
              <li>
                <span className="icon">📞</span>
                <div>
                  <strong>전화 문의</strong>
                  <p>02-1234-5678</p>
                </div>
              </li>
              <li>
                <span className="icon">✉️</span>
                <div>
                  <strong>이메일</strong>
                  <p>springfest@seoul.go.kr</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="detail-section">
            <h3>유의사항</h3>
            <ul className="detail-bullet-list">
              <li>반려동물 동반 입장 가능 (목줄 필수)</li>
              <li>텐트 및 돗자리 사용 가능한 지정 구역이 있습니다.</li>
              <li>축제 기간 중 일부 도로가 통제될 수 있습니다.</li>
              <li>날씨에 따라 일정이 변경될 수 있습니다.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
