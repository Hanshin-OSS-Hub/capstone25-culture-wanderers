import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../api/authFetch";
import { addCalendarEvent } from "../utils/calendarStorage";
import "./AiCoursePage.css";

const WEATHER_OPTIONS = ["상관없음", "화창한 날", "비 오는 날"];
const COMPANION_OPTIONS = ["상관없음", "혼자", "친구", "데이트", "가족"];
const MEAL_OPTIONS = ["식사 포함", "카페만", "식사 제외"];
const CATEGORY_OPTIONS = [
  "축제·페스티벌",
  "공연·콘서트",
  "전시·미술",
  "박물관·역사",
  "전통문화",
  "체험·클래스",
  "마켓·플리마켓",
  "푸드·먹거리",
  "야외·산책",
  "가족·어린이",
  "데이트·야간",
];
const FESTIVAL_PAGE_SIZE = 4;

const CATEGORY_KEYWORDS = {
  "축제·페스티벌": ["축제", "페스티벌", "festival", "문화제"],
  "공연·콘서트": ["공연", "콘서트", "음악", "뮤지컬", "연극", "무대", "오페라", "국악", "클래식", "밴드"],
  "전시·미술": ["전시", "미술", "미술관", "갤러리", "아트", "작가", "화랑", "공예", "사진", "회화", "설치"],
  "박물관·역사": ["박물관", "역사", "유적", "유산", "궁", "고궁", "왕궁", "기념관", "문화재", "사적", "고분", "성곽", "민속"],
  "전통문화": ["전통", "한복", "국악", "민속", "문화재", "궁", "고궁", "한옥", "다례"],
  "체험·클래스": ["체험", "클래스", "워크숍", "만들기", "교육", "실습", "공방"],
  "마켓·플리마켓": ["마켓", "플리마켓", "장터", "시장", "판매", "셀러"],
  "푸드·먹거리": ["푸드", "먹거리", "음식", "맛", "요리", "식문화", "디저트"],
  "야외·산책": ["야외", "산책", "공원", "광장", "거리", "둘레길", "정원"],
  "가족·어린이": ["가족", "어린이", "아이", "키즈", "유아", "아동"],
  "데이트·야간": ["데이트", "야간", "밤", "나이트", "라이트", "조명"],
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z가-힣]/g, "");

const festivalMatchesSelectedCategories = (festival, categories) => {
  if (!categories.length) return true;

  const text = normalizeText(
    [
      festival.title,
      festival.category,
      festival.description,
      festival.location,
      festival.region,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return categories.some((category) =>
    (CATEGORY_KEYWORDS[category] || [category]).some((keyword) => text.includes(normalizeText(keyword))),
  );
};

const normalizeFestival = (item) => ({
  ...item,
  thumbnailUrl: item.thumbnailUrl || item.thumbnail_url || "",
  startDate: item.startDate || item.start_date || "",
  endDate: item.endDate || item.end_date || "",
  homepageUrl: item.homepageUrl || item.homepage_url || "",
});

const normalizeDedupeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z가-힣]/g, "");

const getFestivalDedupeKey = (festival) => {
  const title = normalizeDedupeText(festival.title);
  const startDate = normalizeDedupeText(festival.startDate);
  const endDate = normalizeDedupeText(festival.endDate);

  if (title && (startDate || endDate)) {
    return [title, startDate, endDate].join("|");
  }

  return [
    title,
    normalizeDedupeText(festival.region),
    normalizeDedupeText(festival.location),
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

const formatDate = (value) => {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
  }
  return raw.split("T")[0].replaceAll("-", ".");
};

const toInputDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const raw = String(value);
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw.split("T")[0] || new Date().toISOString().slice(0, 10);
};

export default function AiCoursePage() {
  const navigate = useNavigate();
  const [area, setArea] = useState("종로");
  const [isFreeBudget, setIsFreeBudget] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(30000);
  const [weather, setWeather] = useState("상관없음");
  const [companion, setCompanion] = useState("상관없음");
  const [meal, setMeal] = useState("카페만");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [festivalLoading, setFestivalLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [festivalPages, setFestivalPages] = useState([]);
  const [festivalPageIndex, setFestivalPageIndex] = useState(0);
  const [draggingFestivalId, setDraggingFestivalId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [error, setError] = useState("");

  const budgetText = isFreeBudget ? "무료" : `${budgetAmount.toLocaleString()}원 이하`;
  const currentFestivalPage = festivalPages[festivalPageIndex] || [];
  const allShownFestivals = festivalPages.flat();
  const allShownFestivalIds = festivalPages
    .flat()
    .map((festival) => festival.id)
    .filter(Boolean);

  const conditionText = useMemo(() => {
    const parts = [`예산은 ${budgetText}`];
    if (weather === "화창한 날") {
      parts.push("화창한 날이라 야외 산책과 주변 거리 구경을 포함");
    } else if (weather === "비 오는 날") {
      parts.push("비 오는 날이라 실내 행사, 전시, 공연, 미술관, 박물관 위주");
    }
    if (companion !== "상관없음") {
      parts.push(`${companion}와 가기 좋은 분위기`);
    }
    if (selectedCategories.length > 0) {
      parts.push(`${selectedCategories.join(", ")} 카테고리 중심`);
    }
    if (meal === "카페만") {
      parts.push("식사는 빼고 카페 휴식만 포함");
    } else if (meal === "식사 제외") {
      parts.push("식사 일정 제외");
    } else {
      parts.push("점심과 저녁 식사 포함");
    }
    return parts.join(", ");
  }, [budgetText, companion, meal, selectedCategories, weather]);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  const buildQuery = () => `${area.trim()} 하루 코스 짜줘. 조건: ${conditionText}.`;

  const fetchCourse = async ({ excludeIds = [], replace = false } = {}) => {
    const query = buildQuery();
    const response = await authFetch("/api/ai/recommend", {
      method: "POST",
      body: JSON.stringify({
        query,
        limit: FESTIVAL_PAGE_SIZE,
        excludeIds,
        categories: selectedCategories,
      }),
    });

    const festivals = Array.isArray(response?.festivals)
      ? dedupeFestivals(response.festivals
          .map(normalizeFestival)
          .filter((festival) => festivalMatchesSelectedCategories(festival, selectedCategories)))
      : [];
    const itinerary = normalizeItinerary(response?.itinerary);
    const nearbyFestivals = Array.isArray(response?.nearbyFestivals)
      ? dedupeFestivals(response.nearbyFestivals
          .map(normalizeFestival)
          .filter((festival) => festivalMatchesSelectedCategories(festival, selectedCategories)))
      : [];

    if (replace) {
      setResult({ query, festivals, itinerary, nearbyFestivals });
      setFestivalPages(festivals.length > 0 ? [festivals] : []);
      setFestivalPageIndex(0);
      return festivals;
    }

    setResult((prev) => ({
      ...(prev || {}),
      query,
      festivals,
    }));
    if (festivals.length > 0) {
      setFestivalPages((prev) => [...prev, festivals]);
      setFestivalPageIndex((prev) => prev + 1);
    }
    return festivals;
  };

  const requestCourse = async () => {
    if (!area.trim()) {
      alert("지역이나 동네를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await fetchCourse({ replace: true });
    } catch (err) {
      console.error("AI 하루 코스 생성 실패:", err);
      setError("하루 코스를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
      setResult(null);
      setFestivalPages([]);
      setFestivalPageIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const showPreviousFestivals = () => {
    setFestivalPageIndex((prev) => Math.max(0, prev - 1));
  };

  const showNextFestivals = async () => {
    if (festivalPageIndex < festivalPages.length - 1) {
      setFestivalPageIndex((prev) => prev + 1);
      return;
    }

    setFestivalLoading(true);
    setError("");
    try {
      const nextFestivals = await fetchCourse({ excludeIds: allShownFestivalIds });
      if (!nextFestivals || nextFestivals.length === 0) {
        setError("더 보여드릴 추천 행사가 없어요.");
      }
    } catch (err) {
      console.error("다음 추천 행사 로딩 실패:", err);
      setError("다음 추천 행사를 불러오지 못했어요.");
    } finally {
      setFestivalLoading(false);
    }
  };

  const findDraggedFestival = (event) => {
    const dragId = event.dataTransfer.getData("application/x-festival-id") || draggingFestivalId;
    if (!dragId) return null;
    return allShownFestivals.find((festival) => String(festival.id) === String(dragId)) || null;
  };

  const festivalToCourseItem = (festival, fallbackTime = "15:00") => ({
    time: fallbackTime,
    title: `${festival.title} 관람`,
    description: "추천 행사에서 코스에 추가했어요. 행사 상세에서 운영 시간과 예매 정보를 확인해보세요.",
    location: festival.location || festival.region || area,
    mapUrl: festival.homepageUrl || "",
    festivalId: festival.id || null,
    festivalTitle: festival.title || "",
  });

  const handleFestivalDragStart = (event, festival) => {
    setDraggingFestivalId(festival.id);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-festival-id", String(festival.id));
  };

  const handleFestivalDropOnStop = (event, targetIndex) => {
    event.preventDefault();
    const festival = findDraggedFestival(event);
    if (!festival) return;

    setResult((prev) => {
      if (!prev?.itinerary?.length) return prev;
      return {
        ...prev,
        itinerary: prev.itinerary.map((item, index) =>
          index === targetIndex ? festivalToCourseItem(festival, item.time || "15:00") : item,
        ),
      };
    });
    setDraggingFestivalId(null);
    setDropIndex(null);
  };

  const handleFestivalDropAppend = (event) => {
    event.preventDefault();
    const festival = findDraggedFestival(event);
    if (!festival) return;

    setResult((prev) => {
      const itinerary = Array.isArray(prev?.itinerary) ? prev.itinerary : [];
      return {
        ...(prev || {}),
        itinerary: [...itinerary, festivalToCourseItem(festival)],
      };
    });
    setDraggingFestivalId(null);
    setDropIndex(null);
  };

  const removeCourseItem = (targetIndex) => {
    setResult((prev) => {
      if (!prev?.itinerary?.length) return prev;
      return {
        ...prev,
        itinerary: prev.itinerary.filter((_, index) => index !== targetIndex),
      };
    });
  };

  const addToCalendar = () => {
    if (!result?.itinerary?.length) return;
    const mainFestival = currentFestivalPage[0] || result.festivals?.[0];
    const calendarResult = addCalendarEvent({
      date: toInputDate(mainFestival?.startDate),
      title: `${area.trim() || "AI"} 하루 코스`,
      location: result.itinerary[0]?.location || area,
      description: `AI 하루 코스 조건: ${conditionText}`,
      festivalId: mainFestival?.id || null,
      itineraryItems: result.itinerary,
      nearbyFestivals: result.nearbyFestivals,
      courseSource: "ai-course-page",
    });

    if (!calendarResult.added) {
      alert("같은 일정이 이미 캘린더에 있어요.");
      return;
    }

    alert("하루 코스를 캘린더에 추가했어요.");
    navigate("/mypage/calendar");
  };

  return (
    <main className="ai-course-page">
      <section className="ai-course-hero">
        <div>
          <p>AI 하루 코스</p>
          <h1>예산, 날씨, 동행 유형에 맞춰 하루 일정을 만들어요</h1>
        </div>
        <button type="button" onClick={() => navigate("/")}>
          홈으로
        </button>
      </section>

      <section className="ai-course-builder">
        <div className="ai-course-field wide">
          <label htmlFor="ai-course-area">지역 또는 동네</label>
          <input
            id="ai-course-area"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder="예) 홍대, 성수, 종로"
          />
        </div>

        <div className="ai-course-budget wide">
          <div className="ai-course-budget-head">
            <label htmlFor="ai-course-budget">예산</label>
            <strong>{budgetText}</strong>
          </div>
          <label className="ai-course-free-toggle">
            <input
              type="checkbox"
              checked={isFreeBudget}
              onChange={(event) => setIsFreeBudget(event.target.checked)}
            />
            무료 코스로 보기
          </label>
          <div className="ai-course-budget-controls">
            <input
              id="ai-course-budget"
              type="range"
              min="5000"
              max="100000"
              step="5000"
              value={budgetAmount}
              disabled={isFreeBudget}
              onChange={(event) => setBudgetAmount(Number(event.target.value))}
            />
            <input
              type="number"
              min="0"
              step="1000"
              value={isFreeBudget ? 0 : budgetAmount}
              disabled={isFreeBudget}
              onChange={(event) => setBudgetAmount(Math.max(0, Number(event.target.value) || 0))}
            />
          </div>
        </div>

        <div className="ai-course-field">
          <label>날씨</label>
          <select value={weather} onChange={(event) => setWeather(event.target.value)}>
            {WEATHER_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="ai-course-field">
          <label>동행 유형</label>
          <select value={companion} onChange={(event) => setCompanion(event.target.value)}>
            {COMPANION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="ai-course-field">
          <label>식사</label>
          <select value={meal} onChange={(event) => setMeal(event.target.value)}>
            {MEAL_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="ai-course-category-panel wide">
          <div className="ai-course-category-head">
            <label>상세 카테고리</label>
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              disabled={selectedCategories.length === 0}
            >
              전체 해제
            </button>
          </div>
          <div className="ai-course-category-chips" aria-label="상세 카테고리 여러 개 선택">
            {CATEGORY_OPTIONS.map((option) => {
              const active = selectedCategories.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  className={active ? "active" : ""}
                  aria-pressed={active}
                  onClick={() => toggleCategory(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ai-course-condition">
          <strong>적용 조건</strong>
          <span>{conditionText}</span>
        </div>

        <button type="button" className="ai-course-submit" onClick={requestCourse} disabled={loading}>
          {loading ? "코스 만드는 중..." : "AI 하루 코스 만들기"}
        </button>
      </section>

      {error ? <div className="ai-course-error">{error}</div> : null}

      {result ? (
        <section className="ai-course-result">
          <div className="ai-course-result-head">
            <div>
              <p>추천 일정</p>
              <h2>{area} 하루 코스</h2>
            </div>
            <button type="button" onClick={addToCalendar} disabled={!result.itinerary.length}>
              캘린더 추가
            </button>
          </div>

          {result.itinerary.length > 0 ? (
            <div className="ai-course-timeline">
              {result.itinerary.map((item, index) => (
                <article
                  key={`${item.time}-${index}`}
                  className={`ai-course-stop ${dropIndex === index ? "drag-over" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                    setDropIndex(index);
                  }}
                  onDragLeave={() => setDropIndex(null)}
                  onDrop={(event) => handleFestivalDropOnStop(event, index)}
                >
                  <time>{item.time}</time>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span>{item.location}</span>
                  </div>
                  {item.mapUrl ? (
                    <a href={item.mapUrl} target="_blank" rel="noreferrer">
                      지도
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="ai-course-stop-remove"
                    aria-label={`${item.title} 일정 삭제`}
                    onClick={() => removeCourseItem(index)}
                  >
                    ×
                  </button>
                </article>
              ))}
              <div
                className={`ai-course-drop-zone ${dropIndex === "append" ? "drag-over" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                  setDropIndex("append");
                }}
                onDragLeave={() => setDropIndex(null)}
                onDrop={handleFestivalDropAppend}
              >
                추천 행사를 여기로 끌어오면 코스에 새 일정으로 추가돼요.
              </div>
            </div>
          ) : (
            <div className="ai-course-empty">조건에 맞는 하루 코스를 찾지 못했어요.</div>
          )}

          {currentFestivalPage.length > 0 ? (
            <div className="ai-course-festivals">
              <div className="ai-course-festival-head">
                <h2>추천 행사</h2>
                <div className="ai-course-festival-pager">
                  <button type="button" onClick={showPreviousFestivals} disabled={festivalPageIndex === 0}>
                    이전
                  </button>
                  <span>{festivalPageIndex + 1} / {Math.max(festivalPages.length, 1)}</span>
                  <button type="button" onClick={showNextFestivals} disabled={festivalLoading}>
                    {festivalLoading ? "불러오는 중" : "다음 추천"}
                  </button>
                </div>
              </div>
              <div className="ai-course-festival-grid">
                {currentFestivalPage.map((festival) => (
                  <article
                    key={festival.id}
                    className={`ai-course-festival ${
                      String(draggingFestivalId) === String(festival.id) ? "dragging" : ""
                    }`}
                    draggable
                    onDragStart={(event) => handleFestivalDragStart(event, festival)}
                    onDragEnd={() => {
                      setDraggingFestivalId(null);
                      setDropIndex(null);
                    }}
                  >
                    {festival.thumbnailUrl ? <img src={festival.thumbnailUrl} alt="" /> : <span />}
                    <strong>{festival.title}</strong>
                    <p>{[formatDate(festival.startDate), festival.category, festival.region].filter(Boolean).join(" · ")}</p>
                    <div className="ai-course-festival-actions">
                      <button type="button" onClick={() => navigate(`/detail/${festival.id}`)}>
                        상세보기
                      </button>
                      <span>끌어서 일정에 추가</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
