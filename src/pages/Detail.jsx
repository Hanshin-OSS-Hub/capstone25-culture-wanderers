import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css'; 

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); 

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/festivals/${id}`);
        setFestival(response.data);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="loading-box">데이터를 불러오는 중...</div>;
  if (!festival) return <div className="loading-box">축제 정보를 찾을 수 없습니다.</div>;

  // 축제 날짜 고정 함수 (YYYYMMDD 형식 완벽 대응)
  const formatDate = (dateString) => {
    if (!dateString || dateString === '미정' || dateString.startsWith('0000')) {
      return '공식정보를 확인하세요';
    }

    // 1. T가 포함된 ISO 형식(2026-01-27T...)인 경우
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0];
      const parts = datePart.split('-');
      return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
    }

    // 2. 숫자로만 된 형식(20260127)인 경우
    if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}년 ${month}월 ${day}일`;
    }

    return '공식정보를 확인하세요';
  };

  // 상단 표시용 날짜 (시작일/종료일 중 하나라도 이상하면 공식정보 유도)
  const displayDate = () => {
    const start = formatDate(festival.start_date);
    const end = formatDate(festival.end_date);
    if (start === '공식정보를 확인하세요' || end === '공식정보를 확인하세요') {
      return '공식정보를 확인하세요';
    }
    return `${start} ~ ${end}`;
  };

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← 뒤로가기</button>

      <div className="detail-main-card">
        <div className="detail-top">
          <div className="detail-poster">
            {festival.thumbnail_url ? (
              <img src={festival.thumbnail_url} alt={festival.title} />
            ) : (
              <span style={{color:'#999'}}>이미지 없음</span>
            )}
          </div>

          <div className="detail-summary">
            <h1 className="detail-title">{festival.title}</h1>

            <div className="detail-tags">
              <span className="badge-outline light">{festival.category || '행사'}</span>
              <span className="badge-outline light">나들이</span>
              <span className="badge-outline light">{festival.region}</span>
            </div>

            <dl className="detail-info-list">
              <div>
                <dt>행사 기간</dt>
                {/* 고정된 날짜 로직 적용 */}
                <dd>{displayDate()}</dd>
              </div>
              <div>
                <dt>위치</dt>
                <dd>{festival.location}</dd>
              </div>
              <div>
                <dt>문의</dt>
                <dd>{festival.tel || '정보 없음'}</dd>
              </div>
            </dl>

            <div className="detail-price-box">
              <h2>가격 안내</h2>
              <div className="detail-price-row">
                <span>입장료</span>
                <span className="price" dangerouslySetInnerHTML={{ __html: festival.price || '무료' }} />
              </div>
              <button 
                className="detail-price-link"
                onClick={() => window.open(`https://search.naver.com/search.naver?query=${festival.title}`, '_blank')}>
                공식 정보 / 예매처 검색하기 →
              </button>
            </div>
            <button className="detail-reserve-btn">예매 / 참여하기</button>
          </div>
        </div>
      </div>

      <div className="detail-bottom-card">
        <div className="detail-tabs">
          <button className={`detail-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>정보</button>
          <button className={`detail-tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>리뷰</button>
          <button className={`detail-tab ${activeTab === 'party' ? 'active' : ''}`} onClick={() => setActiveTab('party')}>파티원 모집</button>
        </div>

        <div className="detail-tab-panel">
          {activeTab === 'info' && (
            <>
              {/* 행사 소개: 한 줄 요약 표시 */}
              <section className="detail-section">
                <h3>행사 소개</h3>
                <p className="detail-desc-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.8' }}>
                  <strong>[문의]</strong> {festival.tel || '정보 없음'} | <strong>[주소]</strong> {festival.location} | <strong>[상세]</strong> {festival.description?.replace(/\n/g, ' ')}
                </p>
              </section>

              <section className="detail-section">
                <div className="detail-soft-box">
                   <h3 style={{ marginBottom: '15px' }}>운영 안내</h3>
                  <div className="detail-two-column">
                    <div>
                      <p>📅 기간 내 매일 운영</p>
                      <p>📍 {festival.location}</p>
                    </div>
                    <div>
                      <p>📞 {festival.tel || '정보 없음'}</p>
                      <p>🚗 주차 가능 여부 확인 필요</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h3>유의사항</h3>
                <ul className="detail-bullet-list">
                  <li>행사 일정은 날씨 및 현지 사정에 따라 변경될 수 있습니다.</li>
                  <li>반려동물 동반 시 목줄 착용은 필수입니다.</li>
                  <li>쓰레기는 되가져가는 성숙한 시민 의식을 보여주세요.</li>
                </ul>
              </section>
            </>
          )}

          {activeTab === 'review' && (
            <section className="detail-section">
              <h3>리뷰</h3>
              <p style={{ color: '#666' }}>아직 리뷰 기능이 연결되지 않았습니다.</p>
            </section>
          )}

          {activeTab === 'party' && (
            <section className="detail-section">
              <h3>파티원 모집</h3>
              <p style={{ color: '#666' }}>파티원 모집 기능이 아직 연결되지 않았습니다.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}