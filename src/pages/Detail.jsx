import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authFetch } from '../api/authFetch';
import { isFestivalLiked, toggleFestivalLike } from '../utils/likeStorage';
import { addCalendarEvent } from '../utils/calendarStorage';
import '../App.css';

const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;
console.log("KEY:", KAKAO_MAP_KEY);

function loadKakaoMapSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve(window.kakao);
      return;
    }

    const existingScript = document.getElementById('kakao-map-sdk');

    const onLoadKakao = () => {
      if (!window.kakao || !window.kakao.maps) {
        reject(new Error('카카오맵 SDK가 로드되지 않았습니다.'));
        return;
      }

      window.kakao.maps.load(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          resolve(window.kakao);
        } else {
          reject(new Error('카카오맵 services 라이브러리를 불러오지 못했습니다.'));
        }
      });
    };

    if (existingScript) {
      if (window.kakao && window.kakao.maps) {
        onLoadKakao();
      } else {
        existingScript.addEventListener('load', onLoadKakao, { once: true });
        existingScript.addEventListener(
          'error',
          () => {
            reject(new Error('카카오맵 SDK 스크립트 로드에 실패했습니다.'));
          },
          { once: true }
        );
      }
      return;
    }

    if (!KAKAO_MAP_KEY) {
      reject(new Error('VITE_KAKAO_MAP_KEY가 설정되지 않았습니다.'));
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY.trim()}&autoload=false&libraries=services`;
    script.async = true;

    console.log("카카오 SDK URL:", script.src);

    script.onload = onLoadKakao;
    script.onerror = () => {
      console.error("카카오 SDK 로드 실패 URL:", script.src);
      reject(new Error('카카오맵 SDK 스크립트 로드에 실패했습니다.'));
    };

    document.head.appendChild(script);
  });
}

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [festival, setFestival] = useState(null);
  const [partyPosts, setPartyPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [liked, setLiked] = useState(false);
  const [mapError, setMapError] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [visitDate, setVisitDate] = useState('');

  const toInputDate = (value) => {
    if (!value || String(value).startsWith('0000')) return '';

    let dateText = String(value);
    if (dateText.includes('T')) {
      dateText = dateText.split('T')[0];
    }

    if (dateText.length === 8) {
      return `${dateText.slice(0, 4)}-${dateText.slice(4, 6)}-${dateText.slice(6, 8)}`;
    }

    return dateText;
  };

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDefaultVisitDate = (festivalData) => {
    const today = getTodayDate();
    const start = toInputDate(festivalData?.start_date);
    const end = toInputDate(festivalData?.end_date);

    if (start && end) {
      if (today >= start && today <= end) return today;
      return start;
    }

    if (start && !end) {
      if (today >= start) return today;
      return start;
    }

    return today;
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const festivalRes = await axios.get(`http://localhost:8080/api/festivals/${id}`);
        const festivalData = festivalRes.data;

        setFestival(festivalData);
        setLiked(isFestivalLiked(festivalData?.id));
        setVisitDate(getDefaultVisitDate(festivalData));

        try {
          const partyRes = await axios.get(`http://localhost:8080/api/party-posts/festival/${festivalData.id}`);
          let partyData = partyRes.data;

          let partyList = Array.isArray(partyData)
            ? partyData
            : Array.isArray(partyData?.data)
              ? partyData.data
              : [];

          // festivalId 기준 조회가 비어 있으면 festivalTitle로 한 번 더 조회
          if (partyList.length === 0 && festivalData?.title) {
            const titleRes = await axios.get(
              `http://localhost:8080/api/party-posts/festival-title?festivalTitle=${encodeURIComponent(festivalData.title)}`
            );

            const titlePartyData = titleRes.data;
            partyList = Array.isArray(titlePartyData)
              ? titlePartyData
              : Array.isArray(titlePartyData?.data)
                ? titlePartyData.data
                : [];
          }

          const normalizedPartyList = partyList.map((post) => ({
            ...post,
            festivalTitle: post.festivalTitle || '',
            title: post.title || '',
            content: post.content || '',
            maxPeople: post.maxPeople ?? 2,
            currentPeople: post.currentPeople ?? 0,
          }));

          setPartyPosts(normalizedPartyList);
        } catch (error) {
          console.error('파티글 로딩 실패:', error);
          setPartyPosts([]);
        }
      } catch (error) {
        console.error('축제 상세 로딩 실패:', error);
      }

      try {
        const reviewData = await authFetch('/api/me/reviews');

        const reviewList = Array.isArray(reviewData)
          ? reviewData
          : Array.isArray(reviewData?.data)
            ? reviewData.data
            : [];

        const normalizedReviewList = reviewList.map((review) => ({
          ...review,
          targetType: review.targetType || '',
          targetTitle: review.targetTitle || '',
          title: review.title || '',
          content: review.content || '',
          rating: review.rating ?? 0,
          createdAt: review.createdAt || '',
        }));

        setReviews(normalizedReviewList);
      } catch (error) {
        console.error('리뷰 로딩 실패:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  useEffect(() => {
    const syncLikeState = () => {
      if (festival?.id != null) {
        setLiked(isFestivalLiked(festival.id));
      }
    };

    window.addEventListener('festival-likes-changed', syncLikeState);
    window.addEventListener('storage', syncLikeState);

    return () => {
      window.removeEventListener('festival-likes-changed', syncLikeState);
      window.removeEventListener('storage', syncLikeState);
    };
  }, [festival]);

  useEffect(() => {
    if (loading) return;
    if (activeTab !== 'info') return;
    if (!festival?.location) {
      setMapError('주소 정보가 없습니다.');
      return;
    }
    if (!mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        setMapError('');

        const kakao = await loadKakaoMapSdk();
        if (cancelled || !mapRef.current) return;

        const container = mapRef.current;
        const defaultCenter = new kakao.maps.LatLng(37.5665, 126.9780);

        const map = new kakao.maps.Map(container, {
          center: defaultCenter,
          level: 4,
        });

        mapInstanceRef.current = map;

        const drawMarker = (lat, lng, label = '축제 위치') => {
          if (cancelled) return;

          setDestinationCoords({ lat, lng });

          const coords = new kakao.maps.LatLng(lat, lng);

          const marker = new kakao.maps.Marker({
            map,
            position: coords,
          });

          const infowindow = new kakao.maps.InfoWindow({
            content: `
              <div style="padding:8px 12px;font-size:13px;white-space:nowrap;">
                ${label}
              </div>
            `,
          });

          infowindow.open(map, marker);

          setTimeout(() => {
            if (!cancelled && mapInstanceRef.current) {
              mapInstanceRef.current.relayout();
              mapInstanceRef.current.setCenter(coords);
            }
          }, 100);
        };

        const geocoder = new kakao.maps.services.Geocoder();

        geocoder.addressSearch(festival.location, (result, status) => {
          if (cancelled) return;

          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            drawMarker(
              Number(result[0].y),
              Number(result[0].x),
              festival.title || '축제 위치'
            );
            return;
          }

          const places = new kakao.maps.services.Places();

          places.keywordSearch(
            `${festival.title || ''} ${festival.location || ''}`.trim(),
            (data, keywordStatus) => {
              if (cancelled) return;

              if (keywordStatus === kakao.maps.services.Status.OK && data.length > 0) {
                drawMarker(
                  Number(data[0].y),
                  Number(data[0].x),
                  festival.title || '축제 위치'
                );
              } else {
                setMapError('지도 좌표를 찾지 못해 기본 위치로 표시했습니다.');
                drawMarker(37.5665, 126.9780, '기본 위치');
              }
            }
          );
        });
      } catch (e) {
        console.error('카카오맵 초기화 실패:', e);
        setMapError('카카오맵을 불러오지 못했습니다.');
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [loading, activeTab, festival?.location, festival?.title]);

  if (loading) return <div className="loading-box">데이터를 불러오는 중...</div>;
  if (!festival) return <div className="loading-box">축제 정보를 찾을 수 없습니다.</div>;

  const formatDate = (dateString) => {
    if (!dateString || dateString === '미정' || String(dateString).startsWith('0000')) {
      return '공식정보를 확인하세요';
    }

    if (String(dateString).includes('T')) {
      const datePart = String(dateString).split('T')[0];
      const parts = datePart.split('-');
      return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
    }

    if (String(dateString).length === 8) {
      const year = String(dateString).substring(0, 4);
      const month = String(dateString).substring(4, 6);
      const day = String(dateString).substring(6, 8);
      return `${year}년 ${month}월 ${day}일`;
    }

    return '공식정보를 확인하세요';
  };

  const displayDate = () => {
    const start = formatDate(festival.start_date);
    const end = formatDate(festival.end_date);
    if (start === '공식정보를 확인하세요' || end === '공식정보를 확인하세요') {
      return '공식정보를 확인하세요';
    }
    return `${start} ~ ${end}`;
  };

  const renderStars = (rating = 0) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const handleToggleLike = () => {
    const nextLiked = toggleFestivalLike(festival);
    setLiked(nextLiked);
  };

  const filteredPartyPosts = partyPosts;

  const filteredReviews = reviews.filter((review) => {
    const targetType = String(review.targetType || '').trim().toLowerCase();
    const targetTitle = String(review.targetTitle || '').trim().toLowerCase();
    const reviewTitle = String(review.title || '').trim().toLowerCase();
    const reviewContent = String(review.content || '').trim().toLowerCase();
    const currentFestivalTitle = String(festival.title || '').trim().toLowerCase();

    return (
      targetType === 'festival' &&
      (
        targetTitle === currentFestivalTitle ||
        reviewTitle.includes(currentFestivalTitle) ||
        reviewContent.includes(currentFestivalTitle)
      )
    );
  });

  const avgRating =
    filteredReviews.length > 0
      ? (
        filteredReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
        filteredReviews.length
      ).toFixed(1)
      : null;

  const isHotFestival =
    filteredReviews.length >= 2 ||
    filteredPartyPosts.length >= 2 ||
    (liked && filteredReviews.length >= 1);

  const openKakaoMapSearch = () => {
    const keyword = encodeURIComponent(`${festival.title} ${festival.location || ''}`);
    window.open(`https://map.kakao.com/link/search/${keyword}`, '_blank');
  };

  const openKakaoDirections = () => {
    const keyword = encodeURIComponent(festival.location || festival.title);
    window.open(`https://map.kakao.com/link/search/${keyword}`, '_blank');
  };

  const openDirectionsFromMyLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 사용할 수 없습니다.');
      return;
    }

    if (!destinationCoords) {
      alert('축제 위치 좌표를 아직 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fromLat = position.coords.latitude;
        const fromLng = position.coords.longitude;
        const toLat = destinationCoords.lat;
        const toLng = destinationCoords.lng;
        const destinationName = encodeURIComponent(festival.title || '축제 위치');

        const url = `https://map.kakao.com/link/from/내위치,${fromLat},${fromLng}/to/${destinationName},${toLat},${toLng}`;
        window.open(url, '_blank');
      },
      (error) => {
        if (error.code === 1) {
          alert('위치 권한이 거부되었습니다. 브라우저 주소창의 위치 권한을 허용해주세요.');
        } else if (error.code === 2) {
          alert('현재 위치를 확인할 수 없습니다. PC 위치 서비스 또는 네트워크 상태를 확인해주세요.');
        } else if (error.code === 3) {
          alert('위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        } else {
          alert('현재 위치를 가져오지 못했습니다. 위치 권한을 확인해주세요.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const saveToMyCalendar = () => {
    if (!visitDate) {
      alert('방문 예정일을 선택해주세요.');
      return;
    }

    const festivalPeriod = displayDate();

    const result = addCalendarEvent({
      date: visitDate,
      title: festival.title || '축제 일정',
      location: festival.location || '',
      description: festival.description || '',
      festivalPeriod,
    });

    if (!result.added) {
      alert('이미 내 캘린더에 등록된 일정이에요.');
      return;
    }

    alert('내 캘린더에 일정이 저장되었어요.');
    navigate('/mypage/calendar');
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
              <span style={{ color: '#999' }}>이미지 없음</span>
            )}
          </div>

          <div className="detail-summary">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <h1 className="detail-title" style={{ marginBottom: 6 }}>{festival.title}</h1>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {avgRating && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '30px',
                        padding: '0 12px',
                        borderRadius: '999px',
                        background: '#fff7d6',
                        color: '#8a6300',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      ⭐ {avgRating} / 5 ({filteredReviews.length})
                    </span>
                  )}

                  {isHotFestival && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '30px',
                        padding: '0 12px',
                        borderRadius: '999px',
                        background: '#fff0f5',
                        color: '#d14b72',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      🔥 인기 축제
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleLike}
                aria-label={liked ? '좋아요 해제' : '좋아요 추가'}
                title={liked ? '좋아요 해제' : '좋아요 추가'}
                style={{
                  minWidth: '110px',
                  height: '44px',
                  borderRadius: '999px',
                  border: liked ? '1px solid #ff8fb1' : '1px solid #e5e7eb',
                  background: liked ? '#fff0f5' : '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '15px',
                  padding: '0 16px',
                  boxShadow: liked ? '0 2px 8px rgba(255, 143, 177, 0.18)' : 'none',
                }}
              >
                {liked ? '❤️ 좋아요' : '🤍 좋아요'}
              </button>
            </div>

            <div className="detail-tags">
              <span className="badge-outline light">{festival.category || '행사'}</span>
              <span className="badge-outline light">나들이</span>
              <span className="badge-outline light">{festival.region}</span>
            </div>

            <dl className="detail-info-list">
              <div>
                <dt>행사 기간</dt>
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
                <span
                  className="price"
                  dangerouslySetInnerHTML={{ __html: festival.price || '무료' }}
                />
              </div>
              <button
                className="detail-price-link"
                onClick={() =>
                  window.open(`https://search.naver.com/search.naver?query=${festival.title}`, '_blank')
                }
              >
                공식 정보 / 예매처 검색하기 →
              </button>
            </div>

            <div
              style={{
                marginBottom: '12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#555' }}>
                방문 예정일
              </label>

              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                min={toInputDate(festival.start_date) || undefined}
                max={toInputDate(festival.end_date) || undefined}
                style={{
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid #f1e4ee',
                  padding: '0 12px',
                  outline: 'none',
                  background: '#fff',
                }}
              />

              <button
                type="button"
                onClick={saveToMyCalendar}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid #d8d8d8',
                  background: '#fafafa',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#444',
                }}
              >
                내 캘린더에 저장
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {festival.homepage_url ? (
                <button
                  className="detail-reserve-btn"
                  onClick={() => window.open(festival.homepage_url, '_blank', 'noopener,noreferrer')}
                >
                  공식 홈페이지
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-bottom-card">
        <div className="detail-tabs">
          <button
            className={`detail-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            정보
          </button>
          <button
            className={`detail-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            리뷰
          </button>
          <button
            className={`detail-tab ${activeTab === 'party' ? 'active' : ''}`}
            onClick={() => setActiveTab('party')}
          >
            파티원 모집
          </button>
        </div>

        <div className="detail-tab-panel">
          {activeTab === 'info' && (
            <>
              <section className="detail-section">
                <h3>행사 소개</h3>
                <div
                  className="detail-desc-text"
                  style={{
                    lineHeight: '1.9',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word',
                    color: '#444',
                  }}
                >
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>[문의]</strong> {festival.tel || '정보 없음'}
                  </p>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>[주소]</strong> {festival.location}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>[상세]</strong>{' '}
                    {festival.description || '상세 정보 준비 중입니다.'}
                  </p>
                </div>
              </section>

              <section className="detail-section">
                <div className="detail-soft-box">
                  <h3 style={{ marginBottom: '15px' }}>운영 안내</h3>
                  <div className="detail-two-column">
                    <div>
                      <p>기간 내 매일 운영</p>
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
                <div className="detail-soft-box">
                  <h3 style={{ marginBottom: '15px' }}>오시는 길</h3>

                  <div
                    ref={mapRef}
                    style={{
                      width: '100%',
                      height: '360px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: '#f5f5f5',
                      marginBottom: '14px',
                      border: '2px solid #ffb6cc',
                    }}
                  />

                  <div style={{ marginBottom: '12px', color: '#555', lineHeight: '1.7' }}>
                    <div><strong>주소</strong> {festival.location || '주소 정보 없음'}</div>
                    {mapError ? (
                      <div style={{ color: '#d14b72', marginTop: '6px' }}>{mapError}</div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={openKakaoMapSearch}
                      style={{
                        height: '42px',
                        padding: '0 16px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      카카오맵에서 보기
                    </button>

                    <button
                      type="button"
                      onClick={openKakaoDirections}
                      style={{
                        height: '42px',
                        padding: '0 16px',
                        borderRadius: '12px',
                        border: '1px solid #d8d8d8',
                        background: '#fafafa',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#444',
                      }}
                    >
                      길찾기
                    </button>

                    <button
                      type="button"
                      onClick={openDirectionsFromMyLocation}
                      style={{
                        height: '42px',
                        padding: '0 16px',
                        borderRadius: '12px',
                        border: '1px solid #d8d8d8',
                        background: '#fafafa',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#d14b72',
                      }}
                    >
                      내 위치에서 길찾기
                    </button>
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
              <p style={{ color: '#666', marginBottom: '16px' }}>
                이 축제에 대한 후기를 남겨보세요.
              </p>

              <button
                className="detail-reserve-btn"
                style={{ maxWidth: '220px', marginBottom: '24px' }}
                onClick={() =>
                  navigate('/mypage/reviews/new', {
                    state: {
                      targetType: 'festival',
                      targetId: festival.id,
                      targetTitle: festival.title,
                    },
                  })
                }
              >
                리뷰 작성하러 가기
              </button>

              <div className="detail-soft-box">
                <h3 style={{ marginBottom: '12px' }}>현재 등록된 리뷰</h3>

                {filteredReviews.length === 0 ? (
                  <p style={{ color: '#666', margin: 0 }}>
                    아직 이 축제에 등록된 리뷰가 없습니다.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {filteredReviews.map((review) => (
                      <li
                        key={review.id}
                        style={{ cursor: 'pointer', marginBottom: '10px' }}
                        onClick={() => navigate('/mypage/reviews')}
                      >
                        <strong>{review.title}</strong>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {renderStars(review.rating)} · {review.content}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {activeTab === 'party' && (
            <section className="detail-section">
              <h3>파티원 모집</h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                이 축제에 함께 갈 파티원을 모집해보세요.
              </p>

              <button
                className="detail-reserve-btn"
                style={{ maxWidth: '240px', marginBottom: '24px' }}
                onClick={() =>
                  navigate(
                    `/party/write?festivalId=${festival.id}&festivalTitle=${encodeURIComponent(festival.title)}`,
                    {
                      state: {
                        fromFestival: true,
                        festivalId: festival.id,
                        festivalTitle: festival.title,
                        region: festival.region,
                        location: festival.location,
                      },
                    }
                  )
                }
              >
                파티 모집하러 가기
              </button>

              <div className="detail-soft-box">
                <h3 style={{ marginBottom: '12px' }}>현재 모집중 파티</h3>

                {filteredPartyPosts.length === 0 ? (
                  <p style={{ color: '#666', margin: 0 }}>
                    아직 이 축제에 등록된 파티 모집글이 없습니다.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {filteredPartyPosts.map((post) => (
                      <li
                        key={post.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/mypage/posts')}
                      >
                        {post.title} · 모집 현황 {post.currentPeople ?? 0}/{post.maxPeople ?? 2}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}