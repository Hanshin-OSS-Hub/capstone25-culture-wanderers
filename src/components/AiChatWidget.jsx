import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../api/authFetch";
import "./AiChatWidget.css";

const PANEL_SIZE_KEY = "ai_chat_panel_size";
const DEFAULT_PANEL_SIZE = { width: 360, height: 520 };
const MIN_PANEL_WIDTH = 320;
const MIN_PANEL_HEIGHT = 420;
const DESKTOP_SIDE_MARGIN = 32;

export default function AiChatWidget() {
  const navigate = useNavigate();
  const resizeStateRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelSize, setPanelSize] = useState(() => {
    try {
      const raw = localStorage.getItem(PANEL_SIZE_KEY);
      if (!raw) return DEFAULT_PANEL_SIZE;
      const parsed = JSON.parse(raw);
      return {
        width: Number(parsed?.width) || DEFAULT_PANEL_SIZE.width,
        height: Number(parsed?.height) || DEFAULT_PANEL_SIZE.height,
      };
    } catch {
      return DEFAULT_PANEL_SIZE;
    }
  });
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      role: "bot",
      type: "text",
      text: "안녕하세요. 원하는 일정이나 지역을 입력하면 행사와 관련 파티를 추천해드릴게요. 마이페이지에서 선택한 관심사도 함께 반영해요.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(panelSize));
  }, [panelSize]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const state = resizeStateRef.current;
      if (!state) return;

      const maxWidth = Math.max(MIN_PANEL_WIDTH, window.innerWidth - DESKTOP_SIDE_MARGIN);
      const maxHeight = Math.max(MIN_PANEL_HEIGHT, window.innerHeight - 140);
      const nextWidth = Math.min(
        maxWidth,
        Math.max(MIN_PANEL_WIDTH, state.startWidth - (event.clientX - state.startX))
      );
      const nextHeight = Math.min(
        maxHeight,
        Math.max(MIN_PANEL_HEIGHT, state.startHeight - (event.clientY - state.startY))
      );

      setPanelSize({
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      });
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.classList.remove("ai-chat-resizing");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResize = (event) => {
    if (window.innerWidth <= 768) return;
    event.preventDefault();
    resizeStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height,
    };
    document.body.classList.add("ai-chat-resizing");
  };

  const normalizeFestival = (item) => ({
    ...item,
    thumbnail_url: item.thumbnail_url ?? item.thumbnailUrl ?? "",
    start_date: item.start_date ?? item.startDate ?? "",
    end_date: item.end_date ?? item.endDate ?? "",
    homepage_url: item.homepage_url ?? item.homepageUrl ?? "",
    review_count: item.review_count ?? item.reviewCount ?? 0,
    party_count: item.party_count ?? item.partyCount ?? 0,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const raw = String(dateString);

    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
    }

    const datePart = raw.split("T")[0];
    return datePart.replace(/-/g, ".");
  };

  const buildSummaryText = (data, festivals) => {
    const region = data?.extracted?.region;
    const category = data?.extracted?.category;
    const companions = data?.extracted?.companions;

    const companionText =
      companions === "friend"
        ? "친구와 함께 가기 좋은"
        : companions === "alone" || companions === "solo"
          ? "혼자 가기 좋은"
          : companions === "couple"
            ? "데이트하기 좋은"
            : "";

    const regionText = region ? `${region}에서 ` : "";
    const categoryText = category ? `${category} ` : "행사 ";
    const countText =
      festivals.length > 0
        ? `${festivals.length}개 추천해드릴게요.`
        : "조건에 맞는 행사를 찾지 못했어요.";

    return `${regionText}${companionText} ${categoryText}${countText}`.replace(/\s+/g, " ").trim();
  };

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      type: "text",
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await authFetch("/api/ai/recommend", {
        method: "POST",
        body: JSON.stringify({ query }),
      });

      const festivals = Array.isArray(response?.festivals)
        ? response.festivals.map(normalizeFestival)
        : [];

      const botTextMessage = {
        id: Date.now() + 1,
        role: "bot",
        type: "text",
        text: buildSummaryText(response, festivals),
      };

      const botCardMessage = {
        id: Date.now() + 2,
        role: "bot",
        type: "festival_cards",
        festivals,
        fallbackUsed: !!response?.fallbackUsed,
        fallbackMessage:
          response?.fallbackUsed && festivals.length === 0
            ? "AI 응답이 잠시 지연돼서 기본 검색 결과를 보여드렸어요. 잠시 후 다시 시도해보세요."
            : "",
      };

      setMessages((prev) => [...prev, botTextMessage, botCardMessage]);
    } catch (error) {
      console.error("AI 추천 실패:", error);

      const failMessage = {
        id: Date.now() + 1,
        role: "bot",
        type: "text",
        text: "지금은 AI 추천 요청이 많아 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.",
      };

      setMessages((prev) => [...prev, failMessage]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
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

  const fillExamplePrompt = (text) => {
    setInput(text);
  };

  return (
    <>
      <button
        type="button"
        className="ai-chat-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="AI 추천 도우미"
        title="AI 추천 도우미"
      >
        AI
      </button>

      {isOpen && (
        <div
          className="ai-chat-panel"
          style={{
            width: `${panelSize.width}px`,
            height: `${panelSize.height}px`,
          }}
        >
          <div className="ai-chat-header">
            <div>
              <div className="ai-chat-title">AI 추천 도우미</div>
              <div className="ai-chat-subtitle">자연어로 행사와 관련 파티를 추천해드려요</div>
            </div>
            <button type="button" className="ai-chat-close" onClick={() => setIsOpen(false)}>
              X
            </button>
          </div>

          <div className="ai-chat-body">
            {messages.map((message, index) => {
              if (message.type === "text") {
                return (
                  <div key={message.id}>
                    <div className={`ai-chat-bubble ${message.role === "user" ? "user" : "bot"}`}>
                      {message.text}
                    </div>

                    {index === 0 && message.role === "bot" && messages.length === 1 && (
                      <div className="ai-chat-suggests">
                        <button type="button" onClick={() => fillExamplePrompt("서울 무료 축제 추천")}>
                          서울 무료 축제
                        </button>
                        <button type="button" onClick={() => fillExamplePrompt("친구랑 가기 좋은 행사 추천")}>
                          친구랑 갈 행사
                        </button>
                        <button type="button" onClick={() => fillExamplePrompt("내일 서울 전시 추천해줘")}>
                          내일 서울 전시
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (message.type === "festival_cards") {
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
                                파티글 {festival.party_count}개 보기
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="ai-chat-btn secondary"
                                onClick={() => goToPartyWrite(festival)}
                              >
                                파티 모집하기
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
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="예) 서울 전시 추천해줘"
              className="ai-chat-input"
              rows={1}
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

          <button
            type="button"
            className="ai-chat-resize-handle"
            onMouseDown={startResize}
            aria-label="AI 추천 도우미 크기 조절"
            title="드래그해서 크기 조절"
          />
        </div>
      )}
    </>
  );
}
