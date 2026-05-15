import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../api/authFetch";
import { addCalendarEvent } from "../utils/calendarStorage";
import { buildNaverSearchUrl, createRouteGuide } from "../utils/mapRouteUtils";
import "./AiChatWidget.css";

const PANEL_SIZE_KEY = "ai_chat_panel_size";
const DEFAULT_PANEL_SIZE = { width: 360, height: 520 };
const MIN_PANEL_WIDTH = 320;
const MIN_PANEL_HEIGHT = 420;
const DESKTOP_SIDE_MARGIN = 32;
const INTRO_MESSAGE =
  "지역이나 동네, 날짜, 무료 여부를 말해주면 진행 중인 문화행사를 찾아드려요. 행사별 상세페이지, 파티 모집, 하루코스, 근처 행사, 지도/길안내, 내 일정 추가까지 이어서 도와드릴게요.";
const PREFERENCE_REGION_OPTIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];
const PREFERENCE_CATEGORY_OPTIONS = [
  "축제",
  "전시",
  "공연",
  "미술관",
  "박물관",
  "페스티벌",
  "먹거리",
  "원데이",
  "체험",
  "플리마켓",
];
const COURSE_BUDGET_OPTIONS = ["상관없음", "무료", "1만원 이하", "2만원 이하", "3만원 이하", "5만원 이하"];
const COURSE_WEATHER_OPTIONS = ["상관없음", "화창한 날", "비 오는 날"];
const COURSE_COMPANION_OPTIONS = ["상관없음", "혼자", "친구", "데이트", "가족"];
const COURSE_MEAL_OPTIONS = ["식사 포함", "카페만", "식사 제외"];

const hasStoredToken = () =>
  Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"));

const createIntroMessage = () => ({
  id: Date.now(),
  role: "bot",
  type: "text",
  text: INTRO_MESSAGE,
  showSuggestions: true,
});

const normalizePreferenceValue = (value) =>
  String(value || "").trim().toLowerCase();

const isSelectablePreferenceCategory = (value) => {
  const normalized = normalizePreferenceValue(value);
  return PREFERENCE_CATEGORY_OPTIONS.some(
    (option) => normalizePreferenceValue(option) === normalized
  );
};

const isSelectablePreferenceRegion = (value) => {
  const normalized = normalizePreferenceValue(value);
  return PREFERENCE_REGION_OPTIONS.some(
    (option) => normalizePreferenceValue(option) === normalized
  );
};

const isInitialAiMessage = (message) =>
  !message ||
  message.type === "login_prompt" ||
  message.type === "preference_prompt" ||
  (message.type === "text" && message.role === "bot" && message.text === INTRO_MESSAGE);

export default function AiChatWidget() {
  const navigate = useNavigate();
  const resizeStateRef = useRef(null);
  const recommendationContextRef = useRef({
    query: "",
    shownIds: [],
  });

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeGuides, setRouteGuides] = useState({});
  const [nearbyIndexes, setNearbyIndexes] = useState({});
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [preferenceSetupStep, setPreferenceSetupStep] = useState("region");
  const [selectedPreferenceRegions, setSelectedPreferenceRegions] = useState([]);
  const [selectedPreferenceCategories, setSelectedPreferenceCategories] = useState([]);
  const [savingPreference, setSavingPreference] = useState(false);
  const [courseBudget, setCourseBudget] = useState("상관없음");
  const [courseWeather, setCourseWeather] = useState("상관없음");
  const [courseCompanion, setCourseCompanion] = useState("상관없음");
  const [courseMeal, setCourseMeal] = useState("식사 포함");
  const [courseOptionsOpen, setCourseOptionsOpen] = useState(false);
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
  const [messages, setMessages] = useState([]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(panelSize));
  }, [panelSize]);

  useEffect(() => {
    if (!isOpen) return;
    if (messages.length > 1) return;
    if (messages.length === 1 && !isInitialAiMessage(messages[0])) return;

    const showInitialMessage = async () => {
      setOnboardingChecked(true);

      if (!hasStoredToken()) {
        if (messages[0]?.type === "login_prompt") return;
        setMessages([
          {
            id: Date.now(),
            role: "bot",
            type: "login_prompt",
          },
        ]);
        return;
      }

      try {
        const preference = await authFetch("/api/recommend/preferences");
        const selectedRegions = Array.isArray(preference?.selectedRegions)
          ? preference.selectedRegions
          : [];
        const selectedCategories = Array.isArray(preference?.selectedCategories)
          ? preference.selectedCategories
          : [];
        const visibleSelectedRegions = selectedRegions.filter(isSelectablePreferenceRegion);
        const visibleSelectedCategories = selectedCategories.filter(isSelectablePreferenceCategory);
        const isInitialPreference =
          visibleSelectedRegions.length === 0 && visibleSelectedCategories.length === 0;

        if (isInitialPreference && messages[0]?.type === "preference_prompt") return;
        if (!isInitialPreference && messages[0]?.type === "text" && messages[0]?.text === INTRO_MESSAGE) return;

        setMessages([
          isInitialPreference
            ? {
                id: Date.now(),
                role: "bot",
                type: "preference_prompt",
              }
            : createIntroMessage(),
        ]);
      } catch (error) {
        console.error("AI 도우미 취향 정보 확인 실패:", error);
        if (messages[0]?.type === "text" && messages[0]?.text === INTRO_MESSAGE) return;
        setMessages([createIntroMessage()]);
      }
    };

    showInitialMessage();
  }, [isOpen, onboardingChecked, messages]);

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

  const continueAsGuest = () => {
    setMessages([createIntroMessage()]);
  };

  const skipPreferenceSetup = () => {
    setMessages([createIntroMessage()]);
  };

  const showPreferencePicker = () => {
    setPreferenceSetupStep("region");
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "bot",
        type: "preference_picker",
      },
    ]);
  };

  const togglePreferenceRegion = (region) => {
    setSelectedPreferenceRegions((prev) =>
      prev.includes(region)
        ? prev.filter((item) => item !== region)
        : [...prev, region]
    );
  };

  const togglePreferenceCategory = (category) => {
    setSelectedPreferenceCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const savePreferenceCategories = async () => {
    if (selectedPreferenceRegions.length === 0) {
      alert("관심 지역을 하나 이상 선택해주세요.");
      setPreferenceSetupStep("region");
      return;
    }

    if (selectedPreferenceCategories.length === 0) {
      alert("관심 카테고리를 하나 이상 선택해주세요.");
      setPreferenceSetupStep("category");
      return;
    }

    setSavingPreference(true);
    try {
      await authFetch("/api/recommend/preferences/selection", {
        method: "PUT",
        body: JSON.stringify({
          regions: selectedPreferenceRegions,
          categories: selectedPreferenceCategories,
        }),
      });

      setMessages((prev) => [
        ...prev.filter((message) => message.type !== "preference_picker"),
        {
          id: Date.now(),
          role: "bot",
          type: "text",
          text: `${selectedPreferenceRegions.join(", ")} 지역과 ${selectedPreferenceCategories.join(", ")} 관심사를 저장했어요. 이제 취향을 반영해서 추천해드릴게요.`,
        },
        createIntroMessage(),
      ]);
    } catch (error) {
      console.error("AI 도우미 관심 카테고리 저장 실패:", error);
      alert("관심사 저장에 실패했어요.");
    } finally {
      setSavingPreference(false);
    }
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

  const normalizeFestivalDedupeText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^0-9a-z가-힣]/g, "");

  const getFestivalDedupeKey = (festival) => {
    const title = normalizeFestivalDedupeText(festival.title);
    const startDate = normalizeFestivalDedupeText(festival.start_date);
    const endDate = normalizeFestivalDedupeText(festival.end_date);

    if (title && (startDate || endDate)) {
      return [title, startDate, endDate].join("|");
    }

    return [
      title,
      normalizeFestivalDedupeText(festival.region),
      normalizeFestivalDedupeText(festival.location),
    ].join("|");
  };

  const dedupeFestivals = (items) => {
    const unique = new Map();
    (Array.isArray(items) ? items : []).forEach((festival) => {
      const key = getFestivalDedupeKey(festival);
      if (!unique.has(key)) {
        unique.set(key, festival);
      }
    });
    return Array.from(unique.values());
  };

  const normalizeItinerary = (items) =>
    Array.isArray(items)
      ? items.map((item) => ({
          time: item.time || "",
          title: item.title || "",
          description: item.description || "",
          location: item.location || "",
          mapUrl: item.mapUrl || item.map_url || "",
        }))
      : [];

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const raw = String(dateString);

    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
    }

    const datePart = raw.split("T")[0];
    return datePart.replace(/-/g, ".");
  };

  const toInputDate = (dateString) => {
    if (!dateString) return "";
    const raw = String(dateString);
    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
    return raw.split("T")[0] || "";
  };

  const formatTimeInput = (value) => {
    const digits = String(value || "").replace(/[^\d]/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const buildMapSearchUrl = (keyword) =>
    `https://map.naver.com/p/search/${encodeURIComponent(keyword || "")}`;

  const isGenericCourseRequest = (query, extracted) => {
    const normalized = String(query || "").replace(/\s+/g, "");
    const hasCourseIntent =
      normalized.includes("하루코스") ||
      normalized.includes("하루일정") ||
      normalized.includes("코스") ||
      normalized.includes("일정");
    const hasSpecificCondition =
      Boolean(extracted?.region) ||
      Boolean(extracted?.date) ||
      Boolean(extracted?.startDate) ||
      Boolean(extracted?.endDate);

    return hasCourseIntent && !hasSpecificCondition;
  };

  const buildSummaryText = (data, festivals) => {
    const itinerary = normalizeItinerary(data?.itinerary);
    const region = data?.extracted?.region;

    if (festivals.length === 0) {
      return region
        ? `${region} 조건에 맞는 진행 중 문화행사가 없어요. 다른 지역이나 날짜로 다시 검색해보세요.`
        : "조건에 맞는 진행 중 문화행사가 없어요. 지역이나 날짜 조건을 바꿔 다시 검색해보세요.";
    }

    if (itinerary.length > 0) {
      if (isGenericCourseRequest(data?.query, data?.extracted)) {
        return "인기 축제 중 하나로 하루 코스를 짜드릴게요. 날짜와 지역 정보를 입력하면 조건에 맞는 하루 코스를 구성해드릴 수 있어요.";
      }

      return "요청하신 조건으로 하루 코스를 짜봤어요. 아래 일정표와 추천 행사를 함께 확인해보세요.";
    }

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

  const isMoreRequest = (query) => {
    const normalized = query.replace(/\s+/g, "");
    return (
      recommendationContextRef.current.query &&
      (normalized.includes("더추천") ||
        normalized.includes("추가추천") ||
        normalized.includes("더해") ||
        normalized.includes("더줘") ||
        normalized.includes("더보기") ||
        normalized.includes("10개더") ||
        normalized === "더")
    );
  };

  const parseRequestedLimit = (query, fallback = 5) => {
    const match = query.match(/(\d+)\s*개/);
    if (!match) return fallback;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(Math.max(value, 1), 20);
  };

  const isCourseQuery = (query) => {
    const normalized = String(query || "").replace(/\s+/g, "");
    return (
      normalized.includes("하루코스") ||
      normalized.includes("코스") ||
      normalized.includes("일정") ||
      normalized.includes("동선")
    );
  };

  const buildCourseConditionText = () => {
    const conditions = [];

    if (courseBudget !== "상관없음") {
      conditions.push(`예산은 ${courseBudget}`);
    }

    if (courseWeather === "비 오는 날") {
      conditions.push("비 오는 날이라 실내 행사, 전시, 공연, 미술관, 박물관 위주");
    } else if (courseWeather === "화창한 날") {
      conditions.push("화창한 날이라 야외 산책과 주변 거리 구경 포함");
    }

    if (courseCompanion !== "상관없음") {
      conditions.push(`${courseCompanion}와 가기 좋은 분위기`);
    }

    if (courseMeal === "카페만") {
      conditions.push("식사는 빼고 카페 휴식만 포함");
    } else if (courseMeal === "식사 제외") {
      conditions.push("식사 일정 제외");
    } else {
      conditions.push("점심과 저녁 식사 포함");
    }

    return conditions.length > 0 ? ` 조건: ${conditions.join(", ")}.` : "";
  };

  const requestRecommendation = async (displayQuery, options = {}) => {
    const query = displayQuery.trim();
    if (!query || loading) return;

    const moreRequest = options.moreRequest ?? isMoreRequest(query);
    const baseQuery = options.queryOverride || (moreRequest ? recommendationContextRef.current.query : query);
    const effectiveQuery =
      isCourseQuery(baseQuery) && !options.skipCourseOptions
        ? `${baseQuery}${buildCourseConditionText()}`
        : baseQuery;
    const limit = options.limit || parseRequestedLimit(query, moreRequest ? 5 : 5);
    const excludeIds = options.excludeIds || (moreRequest ? recommendationContextRef.current.shownIds : []);

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
        body: JSON.stringify({
          query: effectiveQuery,
          limit,
          excludeIds,
          targetFestivalId: options.targetFestivalId,
        }),
      });

      const festivals = Array.isArray(response?.festivals)
        ? dedupeFestivals(response.festivals.map(normalizeFestival))
        : [];
      const itinerary = normalizeItinerary(response?.itinerary);
      const nearbyFestivals = Array.isArray(response?.nearbyFestivals)
        ? dedupeFestivals(response.nearbyFestivals.map(normalizeFestival))
        : [];

      const botTextMessage = {
        id: Date.now() + 1,
        role: "bot",
        type: "text",
        text: buildSummaryText(response, festivals),
      };

      const botItineraryMessage = {
        id: Date.now() + 2,
        role: "bot",
        type: "itinerary",
        itinerary,
        nearbyFestivals,
        courseDate: toInputDate(festivals[0]?.start_date),
        courseTitle: festivals[0]?.title ? `${festivals[0].title} 하루 코스` : "AI 하루 코스",
        festivalId: festivals[0]?.id || null,
      };

      const botCardMessage = {
        id: Date.now() + 4,
        role: "bot",
        type: "festival_cards",
        festivals,
        fallbackUsed: !!response?.fallbackUsed,
        fallbackMessage:
          response?.fallbackUsed && festivals.length === 0
            ? "AI 응답이 잠시 지연돼서 기본 검색 결과를 보여드렸어요. 잠시 후 다시 시도해보세요."
            : "",
      };

      const nextBotMessages = [
        botTextMessage,
        ...(festivals.length > 0 ? [botCardMessage] : []),
        ...(itinerary.length > 0 ? [botItineraryMessage] : []),
      ];

      setMessages((prev) => [...prev, ...nextBotMessages]);

      if (!options.targetFestivalId && festivals.length > 0) {
        const previousIds = moreRequest ? recommendationContextRef.current.shownIds : [];
        recommendationContextRef.current = {
          query: effectiveQuery,
          shownIds: [...new Set([...previousIds, ...festivals.map((festival) => festival.id)])],
        };
      }
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

  const handleSend = async () => {
    const query = input.trim();
    await requestRecommendation(query);
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

  const requestFestivalCourse = (festival) => {
    requestRecommendation(`${festival.title} 하루 코스 짜줘`, {
      queryOverride: `${festival.title} 하루 코스 짜줘`,
      targetFestivalId: festival.id,
      limit: 1,
      excludeIds: [],
      moreRequest: false,
      skipCourseOptions: false,
    });
  };

  const addNearbyFestivalToCourse = (itineraryMessageId, festival) => {
    const location = festival.location || festival.region || "";
    const mapUrl = buildMapSearchUrl(festival.title || location);

    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== itineraryMessageId || message.type !== "itinerary") {
          return message;
        }

        return {
          ...message,
          itinerary: message.itinerary.map((item) =>
            item.time === "17:00"
              ? {
                  time: "17:00",
                  title: festival.title,
                  description: "선택한 행사 위치 인근 문화행사를 하루 코스에 추가했어요.",
                  location,
                  mapUrl,
                }
              : item
          ),
        };
      })
    );
  };

  const updateCourseItemLocation = (itineraryMessageId, time, value) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== itineraryMessageId || message.type !== "itinerary") {
          return message;
        }

        return {
          ...message,
          itinerary: message.itinerary.map((item) =>
            item.time === time
              ? {
                  ...item,
                  location: value,
                  mapUrl: buildMapSearchUrl(value),
                }
              : item
          ),
        };
      })
    );
  };

  const updateCourseItemTime = (itineraryMessageId, itemIndex, value) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== itineraryMessageId || message.type !== "itinerary") {
          return message;
        }

        return {
          ...message,
          itinerary: message.itinerary.map((item, index) =>
            index === itemIndex ? { ...item, time: value } : item
          ),
        };
      })
    );
  };

  const moveCourseItem = (itineraryMessageId, fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== itineraryMessageId || message.type !== "itinerary") {
          return message;
        }

        const nextItinerary = [...message.itinerary];
        const [moved] = nextItinerary.splice(fromIndex, 1);
        if (!moved) return message;
        nextItinerary.splice(toIndex, 0, moved);

        return {
          ...message,
          itinerary: nextItinerary,
        };
      })
    );
  };

  const addCourseToCalendar = (message) => {
    if (!hasStoredToken()) {
      alert("로그인 후 내 일정에 추가할 수 있어요.");
      navigate("/login");
      return;
    }

    const result = addCalendarEvent({
      date: message.courseDate || new Date().toISOString().slice(0, 10),
      title: message.courseTitle || "AI 하루 코스",
      location: message.itinerary?.[0]?.location || "",
      description: "AI 추천 도우미에서 만든 하루 코스",
      festivalId: message.festivalId || null,
      itineraryItems: message.itinerary || [],
      nearbyFestivals: message.nearbyFestivals || [],
    });

    if (!result.added) {
      alert("같은 일정이 이미 캘린더에 있어요.");
      return;
    }

    alert("하루 코스를 캘린더 일정에 추가했어요.");
    navigate("/mypage/calendar");
  };

  const fillExamplePrompt = (text) => {
    setInput(text);
  };

  const showRouteGuide = async (key, destination) => {
    if (!destination) return;

    const baseGuide = {
      destination,
      origin: "현재 위치 확인 중",
      naverUrl: "https://map.naver.com/p/directions",
      status: "locating",
    };

    setRouteGuides((prev) => ({
      ...prev,
      [key]: baseGuide,
    }));

    try {
      const guide = await createRouteGuide(destination);
      setRouteGuides((prev) => ({
        ...prev,
        [key]: guide,
      }));
    } catch (error) {
      console.error("길안내 생성 실패:", error);
      setRouteGuides((prev) => ({
        ...prev,
        [key]: {
          ...baseGuide,
          origin: "현재 위치 또는 도착지 좌표를 확인할 수 없어요.",
          naverUrl: buildNaverSearchUrl(destination),
          status: "blocked",
          error: error?.message || "route_failed",
        },
      }));
    }
  };

  const changeNearbyIndex = (key, total, direction) => {
    setNearbyIndexes((prev) => {
      const current = prev[key] || 0;
      const pageCount = Math.max(Math.ceil(total / 3), 1);
      const next = (current + direction + pageCount) % pageCount;
      return {
        ...prev,
        [key]: next,
      };
    });
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
        <span className="ai-chat-fab-mark">AI</span>
        <span className="ai-chat-fab-text">문화 추천</span>
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
            {messages.map((message) => {
              if (message.type === "text") {
                return (
                  <div key={message.id}>
                    <div className={`ai-chat-bubble ${message.role === "user" ? "user" : "bot"}`}>
                      {message.text}
                    </div>

                    {message.showSuggestions && (
                      <div className="ai-chat-suggests">
                        <button type="button" onClick={() => fillExamplePrompt("성수 놀거리 추천해줘")}>
                          성수 놀거리
                        </button>
                        <button type="button" onClick={() => fillExamplePrompt("강남 무료 전시 있어?")}>
                          강남 무료 전시
                        </button>
                        <button type="button" onClick={() => fillExamplePrompt("홍대 하루코스 짜줘")}>
                          홍대 하루코스
                        </button>
                        <button type="button" onClick={() => fillExamplePrompt("친구랑 갈 서울 행사 추천해줘")}>
                          친구랑 갈 행사
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (message.type === "login_prompt") {
                return (
                  <div key={message.id} className="ai-chat-onboarding">
                    <div className="ai-chat-bubble bot">
                      로그인을 하시면 내 취향 기반으로 문화행사를 추천해드려요.
                    </div>
                    <div className="ai-chat-onboarding-actions">
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/login");
                        }}
                      >
                        로그인하러가기
                      </button>
                      <button type="button" onClick={continueAsGuest}>
                        비회원으로 이용
                      </button>
                    </div>
                  </div>
                );
              }

              if (message.type === "preference_prompt") {
                return (
                  <div key={message.id} className="ai-chat-onboarding">
                    <div className="ai-chat-bubble bot">
                      아직 취향 분석이 비어 있어요. 간단하게 관심 카테고리를 추가해서 이용할까요?
                    </div>
                    <div className="ai-chat-onboarding-actions">
                      <button type="button" className="primary" onClick={showPreferencePicker}>
                        예
                      </button>
                      <button type="button" onClick={skipPreferenceSetup}>
                        아니오
                      </button>
                    </div>
                  </div>
                );
              }

              if (message.type === "preference_picker") {
                const isRegionStep = preferenceSetupStep === "region";
                const options = isRegionStep ? PREFERENCE_REGION_OPTIONS : PREFERENCE_CATEGORY_OPTIONS;
                const selectedValues = isRegionStep ? selectedPreferenceRegions : selectedPreferenceCategories;

                return (
                  <div key={message.id} className="ai-chat-preference-picker">
                    <div className="ai-chat-preference-title">
                      {isRegionStep ? "관심 지역 선택" : "관심 카테고리 선택"}
                    </div>
                    <div className="ai-chat-preference-subtitle">
                      {isRegionStep
                        ? "먼저 자주 찾고 싶은 지역을 골라주세요. 여러 개 선택할 수 있어요."
                        : "이어서 좋아하는 카테고리를 골라주세요. 여러 개 선택할 수 있어요."}
                    </div>
                    <div className="ai-chat-preference-chips">
                      {options.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={selectedValues.includes(item) ? "active" : ""}
                          onClick={() =>
                            isRegionStep
                              ? togglePreferenceRegion(item)
                              : togglePreferenceCategory(item)
                          }
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="ai-chat-onboarding-actions">
                      {isRegionStep ? (
                        <button
                          type="button"
                          className="primary"
                          onClick={() => {
                            if (selectedPreferenceRegions.length === 0) {
                              alert("관심 지역을 하나 이상 선택해주세요.");
                              return;
                            }
                            setPreferenceSetupStep("category");
                          }}
                        >
                          다음
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreferenceSetupStep("region")}
                          >
                            이전
                          </button>
                          <button
                            type="button"
                            className="primary"
                            onClick={savePreferenceCategories}
                            disabled={savingPreference}
                          >
                            {savingPreference ? "저장 중..." : "관심사 저장"}
                          </button>
                        </>
                      )}
                      <button type="button" onClick={skipPreferenceSetup}>
                        나중에
                      </button>
                    </div>
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

                            <button
                              type="button"
                              className="ai-chat-btn course"
                              onClick={() => requestFestivalCourse(festival)}
                            >
                              하루코스
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              }

              if (message.type === "itinerary") {
                return (
                  <div key={message.id} className="ai-chat-itinerary">
                    <div className="ai-chat-itinerary-title">하루 코스</div>
                    <div className="ai-chat-itinerary-list">
                      {message.itinerary.map((item, itemIndex) => (
                        <div
                          key={`${item.time}-${itemIndex}`}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", String(itemIndex));
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            moveCourseItem(message.id, Number(event.dataTransfer.getData("text/plain")), itemIndex);
                          }}
                        >
                          <div className="ai-chat-itinerary-item">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="07:00"
                              maxLength={5}
                              className="ai-chat-itinerary-time editable"
                              value={item.time || ""}
                              onChange={(event) =>
                                updateCourseItemTime(message.id, itemIndex, formatTimeInput(event.target.value))
                              }
                              onDragStart={(event) => event.preventDefault()}
                            />
                            <div className="ai-chat-itinerary-content">
                              <div className="ai-chat-itinerary-name">{item.title}</div>
                              <div className="ai-chat-itinerary-desc">{item.description}</div>
                              <div className="ai-chat-itinerary-location">{item.location}</div>
                              <input
                                className="ai-chat-place-input"
                                value={item.location}
                                onChange={(event) =>
                                  updateCourseItemLocation(message.id, item.time, event.target.value)
                                }
                                placeholder="선택한 카페/식당/장소 입력"
                              />
                              <div className="ai-chat-itinerary-actions">
                                {item.mapUrl ? (
                                  <button
                                    type="button"
                                    className="ai-chat-map-link"
                                    onClick={() => window.open(item.mapUrl, "_blank", "noopener,noreferrer")}
                                  >
                                    지도에서 보기
                                  </button>
                                ) : null}
                                {item.location ? (
                                  <button
                                    type="button"
                                    className="ai-chat-route-link"
                                    onClick={() => showRouteGuide(`${message.id}-${item.time}`, item.location)}
                                  >
                                    내 위치에서 길안내
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {item.location ? (
                            <div className="ai-chat-route-row">
                              <button
                                type="button"
                                className="ai-chat-route-link"
                                onClick={() => showRouteGuide(`${message.id}-${item.time}`, item.location)}
                              >
                                내 위치에서 길안내
                              </button>
                            </div>
                          ) : null}

                          {routeGuides[`${message.id}-${item.time}`] ? (
                            <div className="ai-chat-route-guide">
                              <div className="ai-chat-route-title">길안내</div>
                              <div className="ai-chat-route-line">
                                <span>출발</span>
                                <strong>{routeGuides[`${message.id}-${item.time}`].origin}</strong>
                              </div>
                              <div className="ai-chat-route-line">
                                <span>도착</span>
                                <strong>{routeGuides[`${message.id}-${item.time}`].destination}</strong>
                              </div>
                              <div className="ai-chat-route-steps">
                                {routeGuides[`${message.id}-${item.time}`].status === "ready" ? (
                                  <>
                                    <div>1. 현재 위치와 도착지 좌표를 기준으로 네이버 길안내를 열어요.</div>
                                    <div>2. 네이버 지도에서 대중교통, 도보, 자동차 경로를 확인할 수 있어요.</div>
                                  </>
                                ) : (
                                  <>
                                    <div>1. 현재 위치 또는 도착지 좌표를 자동 확인하지 못했어요.</div>
                                    <div>2. 아래 버튼으로 도착지를 검색한 뒤 네이버 지도에서 길찾기를 선택해주세요.</div>
                                  </>
                                )}
                              </div>
                              <button
                                type="button"
                                className="ai-chat-map-link"
                                onClick={() =>
                                  window.open(
                                    routeGuides[`${message.id}-${item.time}`].naverUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                              >
                                {routeGuides[`${message.id}-${item.time}`].status === "ready"
                                  ? "네이버 지도에서 경로 확인"
                                  : "도착지 지도에서 검색"}
                              </button>
                            </div>
                          ) : null}

                          {item.time === "17:00" && Array.isArray(message.nearbyFestivals) && message.nearbyFestivals.length > 0 ? (
                            <div className="ai-chat-nearby inline">
                              <div className="ai-chat-nearby-title">인근 문화행사 후보</div>
                              {(() => {
                                const key = `${message.id}-nearby`;
                                const pageIndex = nearbyIndexes[key] || 0;
                                const pageCount = Math.max(Math.ceil(message.nearbyFestivals.length / 3), 1);
                                const visibleFestivals = message.nearbyFestivals.slice(pageIndex * 3, pageIndex * 3 + 3);

                                return (
                                  <>
                                    <div className="ai-chat-nearby-list">
                                      {visibleFestivals.map((festival) => (
                                        <div key={festival.id} className="ai-chat-nearby-card">
                                          {festival.thumbnail_url ? (
                                            <img
                                              src={festival.thumbnail_url}
                                              alt={festival.title}
                                              className="ai-chat-nearby-image"
                                            />
                                          ) : (
                                            <div className="ai-chat-nearby-image placeholder" />
                                          )}

                                          <div className="ai-chat-nearby-info">
                                            <div className="ai-chat-nearby-name">{festival.title}</div>
                                            <div className="ai-chat-nearby-date">
                                              {formatDate(festival.start_date)} - {formatDate(festival.end_date)}
                                            </div>
                                            <div className="ai-chat-nearby-location">
                                              {festival.region} {festival.location}
                                            </div>
                                            <div className="ai-chat-nearby-actions">
                                              <button
                                                type="button"
                                                className="ai-chat-btn primary"
                                                onClick={() => goToDetail(festival.id)}
                                              >
                                                상세페이지
                                              </button>
                                              <button
                                                type="button"
                                                className="ai-chat-btn course"
                                                onClick={() => addNearbyFestivalToCourse(message.id, festival)}
                                              >
                                                추가하기
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="ai-chat-nearby-pager">
                                      <button
                                        type="button"
                                        onClick={() => changeNearbyIndex(key, message.nearbyFestivals.length, -1)}
                                      >
                                        이전 추천
                                      </button>
                                      <span>{pageIndex + 1} / {pageCount}</span>
                                      <button
                                        type="button"
                                        onClick={() => changeNearbyIndex(key, message.nearbyFestivals.length, 1)}
                                      >
                                        다음 추천
                                      </button>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="ai-chat-calendar-add"
                      onClick={() => addCourseToCalendar(message)}
                    >
                      내 일정에 추가하기
                    </button>
                  </div>
                );
              }

              if (message.type === "nearby_festival_candidates") {
                return (
                  <div key={message.id} className="ai-chat-nearby">
                    <div className="ai-chat-nearby-title">인근 문화행사 후보</div>
                    <div className="ai-chat-nearby-list">
                      {message.festivals.map((festival) => (
                        <div key={festival.id} className="ai-chat-nearby-card">
                          {festival.thumbnail_url ? (
                            <img
                              src={festival.thumbnail_url}
                              alt={festival.title}
                              className="ai-chat-nearby-image"
                            />
                          ) : (
                            <div className="ai-chat-nearby-image placeholder" />
                          )}

                          <div className="ai-chat-nearby-info">
                            <div className="ai-chat-nearby-name">{festival.title}</div>
                            <div className="ai-chat-nearby-date">
                              {formatDate(festival.start_date)} - {formatDate(festival.end_date)}
                            </div>
                            <div className="ai-chat-nearby-location">
                              {festival.region} {festival.location}
                            </div>
                            <div className="ai-chat-nearby-actions">
                              <button
                                type="button"
                                className="ai-chat-btn primary"
                                onClick={() => goToDetail(festival.id)}
                              >
                                상세페이지
                              </button>
                              <button
                                type="button"
                                className="ai-chat-btn course"
                                onClick={() => addNearbyFestivalToCourse(message.itineraryMessageId, festival)}
                              >
                                추가하기
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {loading && <div className="ai-chat-bubble bot">추천 내용을 정리하고 있어요...</div>}
          </div>

          <div className="ai-chat-input-wrap">
            <div className={`ai-chat-course-options ${courseOptionsOpen ? "open" : ""}`}>
              <button
                type="button"
                className="ai-chat-course-title"
                onClick={() => setCourseOptionsOpen((prev) => !prev)}
                aria-expanded={courseOptionsOpen}
              >
                <span>하루 코스 조건</span>
                <em>{courseOptionsOpen ? "접기" : "펼치기"}</em>
              </button>
              {!courseOptionsOpen ? (
                <div className="ai-chat-course-summary">
                  {[courseBudget, courseWeather, courseCompanion, courseMeal]
                    .filter((item) => item !== "상관없음")
                    .join(" · ") || "조건 선택 안 함"}
                </div>
              ) : (
                <div className="ai-chat-course-row">
                  <select value={courseBudget} onChange={(event) => setCourseBudget(event.target.value)}>
                    {COURSE_BUDGET_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <select value={courseWeather} onChange={(event) => setCourseWeather(event.target.value)}>
                    {COURSE_WEATHER_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <select value={courseCompanion} onChange={(event) => setCourseCompanion(event.target.value)}>
                    {COURSE_COMPANION_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <select value={courseMeal} onChange={(event) => setCourseMeal(event.target.value)}>
                    {COURSE_MEAL_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <button type="button" className="ai-chat-course-page-link" onClick={() => navigate("/ai-course")}>
                    전용 화면
                  </button>
                </div>
              )}
            </div>
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
