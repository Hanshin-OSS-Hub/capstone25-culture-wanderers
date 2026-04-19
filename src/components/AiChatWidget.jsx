import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AiChatWidget.css';

export default function AiChatWidget() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      role: 'bot',
      type: 'text',
      text: '안녕하세요. 원하는 일정이나 지역을 입력하면 행사와 관련 파티를 추천해드릴게요.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const normalizeFestival = (item) => ({
    ...item,
    thumbnail_url: item.thumbnail_url ?? item.thumbnailUrl ?? '',
    start_date: item.start_date ?? item.startDate ?? '',
    end_date: item.end_date ?? item.endDate ?? '',
    homepage_url: item.homepage_url ?? item.homepageUrl ?? '',
    review_count: item.review_count ?? item.reviewCount ?? 0,
    party_count: item.party_count ?? item.partyCount ?? 0,
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const raw = String(dateString);

    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
    }

    const datePart = raw.split('T')[0];
    return datePart.replace(/-/g, '.');
  };

  const buildSummaryText = (data, festivals) => {
    const region = data?.extracted?.region;
    const category = data?.extracted?.category;
    const companions = data?.extracted?.companions;

    const companionText =
      companions === 'friend'
        ? '친구와 함께 가기 좋은'
        : companions === 'alone' || companions === 'solo'
          ? '혼자 가기 좋은'
          : companions === 'couple'
            ? '데이트하기 좋은'
            : '';

    const regionText = region ? `${region}에서 ` : '';
    const categoryText = category ? `${category} ` : '행사 ';
    const countText = festivals.length > 0 ? `${festivals.length}개 추천해드릴게요.` : '조건에 맞는 행사를 찾지 못했어요.';

    return `${regionText}${companionText} ${categoryText}${countText}`.replace(/\s+/g, ' ').trim();
  };

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      type: 'text',
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/ai/recommend', {
        query,
      });

      const festivals = Array.isArray(response.data?.festivals)
        ? response.data.festivals.map(normalizeFestival)
        : [];

      const botTextMessage = {
        id: Date.now() + 1,
        role: 'bot',
        type: 'text',
        text: buildSummaryText(response.data, festivals),
      };

      const botCardMessage = {
        id: Date.now() + 2,
        role: 'bot',
        type: 'festival_cards',
        festivals,
        fallbackUsed: !!response.data?.fallbackUsed,
        fallbackMessage: response.data?.fallbackUsed ? response.data?.message : '',
      };

      setMessages((prev) => [...prev, botTextMessage, botCardMessage]);
    } catch (error) {
      console.error('AI 챗봇 추천 오류:', error);

      const errorMessage = {
        id: Date.now() + 3,
        role: 'bot',
        type: 'text',
        text: '추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const goToDetail = (festivalId) => {
    navigate(`/detail/${festivalId}`);
  };

  const goToPartyList = (festival) => {
    navigate(`/party?festivalId=${festival.id}&festivalTitle=${encodeURIComponent(festival.title)}`);
  };

  const goToPartyWrite = (festival) => {
    navigate(`/party/write?festivalId=${festival.id}&festivalTitle=${encodeURIComponent(festival.title)}`);
  };

  return (
    <>
      <button
        type="button"
        className="ai-chat-fab"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? '닫기' : 'AI 추천'}
      </button>

      {isOpen && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div>
              <div className="ai-chat-title">AI 추천 도우미</div>
              <div className="ai-chat-subtitle">자연어로 축제와 파티를 추천해드려요</div>
            </div>
            <button
              type="button"
              className="ai-chat-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="ai-chat-body">
            {messages.map((message) => {
              if (message.type === 'text') {
                return (
                  <div
                    key={message.id}
                    className={`ai-chat-bubble ${message.role === 'user' ? 'user' : 'bot'}`}
                  >
                    {message.text}
                  </div>
                );
              }

              if (message.type === 'festival_cards') {
                return (
                  <div key={message.id} className="ai-chat-cards-wrap">
                    {message.fallbackUsed && message.fallbackMessage && (
                      <div className="ai-chat-fallback">{message.fallbackMessage}</div>
                    )}

                    {message.festivals.length === 0 ? (
                      <div className="ai-chat-empty">조건에 맞는 추천 결과가 없어요.</div>
                    ) : (
                      message.festivals.map((festival) => (
                        <div key={festival.id} className="ai-chat-card">
                          <div className="ai-chat-card-top">
                            {festival.thumbnail_url ? (
                              <img
                                src={festival.thumbnail_url}
                                alt={festival.title}
                                className="ai-chat-card-image"
                              />
                            ) : (
                              <div className="ai-chat-card-image placeholder" />
                            )}

                            <div className="ai-chat-card-info">
                              <div className="ai-chat-card-title">{festival.title}</div>
                              <div className="ai-chat-card-date">
                                {formatDate(festival.start_date)} - {formatDate(festival.end_date)}
                              </div>
                              <div className="ai-chat-card-location">
                                {festival.region} {festival.location}
                              </div>
                              <div className="ai-chat-card-meta">
                                리뷰 {festival.review_count ?? 0}건 · 파티 {festival.party_count ?? 0}개
                              </div>
                            </div>
                          </div>

                          <div className="ai-chat-card-actions">
                            <button
                              type="button"
                              className="ai-chat-btn primary"
                              onClick={() => goToDetail(festival.id)}
                            >
                              상세페이지
                            </button>

                            {festival.party_count > 0 ? (
                              <button
                                type="button"
                                className="ai-chat-btn secondary"
                                onClick={() => goToPartyList(festival)}
                              >
                                파티글 {festival.party_count}개 확인하러 가기
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="ai-chat-btn secondary"
                                onClick={() => goToPartyWrite(festival)}
                              >
                                파티글이 없어요 · 작성하러 가기
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              }

              return null;
            })}

            {loading && <div className="ai-chat-bubble bot">추천 내용을 정리하고 있어요...</div>}
          </div>

          <div className="ai-chat-input-wrap">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="서울에서 놀고 싶은데 친구랑 갈 만한 축제 추천해줘"
              className="ai-chat-input"
              rows={2}
            />
            <button
              type="button"
              className="ai-chat-send"
              onClick={handleSend}
              disabled={!canSend}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </>
  );
}