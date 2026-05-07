import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  addCalendarEvent,
  getCalendarEvents,
  removeCalendarEvent,
  saveCalendarEvents,
  updateCalendarEvent,
} from "../../utils/calendarStorage";
import { authFetch } from "../../api/authFetch";
import { buildNaverSearchUrl, createRouteGuide } from "../../utils/mapRouteUtils";
import { addNotification, findNotification, getDisplayName } from "../../utils/notificationStorage";

const KAKAO_MAP_KEY = (import.meta.env.VITE_KAKAO_MAP_KEY || "").trim();
const LOCATION_CERTIFICATION_RADIUS_METERS = 2000;
const PHOTO_DATE_TOLERANCE_DAYS = 1;

function loadKakaoMapSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps?.services) {
      resolve(window.kakao);
      return;
    }

    if (!KAKAO_MAP_KEY) {
      reject(new Error("카카오맵 키가 없어 위치 인증을 사용할 수 없어요."));
      return;
    }

    const existingScript = document.getElementById("kakao-map-sdk");
    const onLoadKakao = () => {
      if (!window.kakao?.maps) {
        reject(new Error("카카오맵 SDK가 로드되지 않았어요."));
        return;
      }

      window.kakao.maps.load(() => {
        if (window.kakao?.maps?.services) {
          resolve(window.kakao);
        } else {
          reject(new Error("카카오맵 주소 검색 기능을 불러오지 못했어요."));
        }
      });
    };

    if (existingScript) {
      if (window.kakao?.maps) {
        onLoadKakao();
        return;
      }

      existingScript.addEventListener("load", onLoadKakao, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("카카오맵 SDK 로드에 실패했어요.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = onLoadKakao;
    script.onerror = () => reject(new Error("카카오맵 SDK 로드에 실패했어요."));
    document.head.appendChild(script);
  });
}

function getDistanceMeters(a, b) {
  const earthRadius = 6371000;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const deltaLat = toRad(b.lat - a.lat);
  const deltaLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getEventCoordinates(address) {
  return loadKakaoMapSdk().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        if (!address?.trim()) {
          reject(new Error("행사 장소 주소가 없어 위치 인증을 할 수 없어요."));
          return;
        }

        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
            return;
          }
          reject(new Error("행사장 주소 좌표를 찾지 못해 위치 인증을 할 수 없어요."));
        });
      })
  );
}

function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치 인증을 사용할 수 없습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("현재 위치를 확인하지 못했어요. 위치 권한을 허용한 뒤 다시 시도해주세요.")),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isWithinPhotoDateWindow(fileDate, visitDate) {
  const visit = toDateOnly(visitDate);
  if (!visit || !fileDate) return false;
  const taken = toDateOnly(fileDate.toISOString().slice(0, 10));
  if (!taken) return false;
  return taken >= addDays(visit, -PHOTO_DATE_TOLERANCE_DAYS) && taken <= addDays(visit, PHOTO_DATE_TOLERANCE_DAYS);
}

const encodeSharedCourse = (event) => {
  const payload = JSON.stringify({
    date: event.date,
    title: event.title,
    location: event.location || "",
    description: event.description || "",
    festivalPeriod: event.festivalPeriod || "",
    festivalId: event.festivalId || null,
    itineraryItems: Array.isArray(event.itineraryItems) ? event.itineraryItems : [],
    nearbyFestivals: Array.isArray(event.nearbyFestivals) ? event.nearbyFestivals : [],
    courseSource: event.courseSource || null,
  });

  return btoa(unescape(encodeURIComponent(payload)));
};

const decodeSharedCourse = (value) =>
  JSON.parse(decodeURIComponent(escape(atob(String(value || "")))));

const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Some browsers block clipboard access on localhost or non-secure contexts.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
};

const getStoredEmail = () =>
  (
    localStorage.getItem("loggedInUser") ||
    sessionStorage.getItem("loggedInUser") ||
    localStorage.getItem("email") ||
    sessionStorage.getItem("email") ||
    ""
  )
    .trim()
    .toLowerCase();

const getStoredNickname = () =>
  localStorage.getItem("nickname") || sessionStorage.getItem("nickname") || "";

const buildInviteEvent = (event) => ({
  date: event.date,
  title: event.title,
  location: event.location || "",
  description: event.description || "",
  festivalPeriod: event.festivalPeriod || "",
  festivalId: event.festivalId || null,
  communityType: event.communityType || "",
  communityId: event.communityId || null,
  itineraryItems: Array.isArray(event.itineraryItems) ? event.itineraryItems : [],
  nearbyFestivals: Array.isArray(event.nearbyFestivals) ? event.nearbyFestivals : [],
  courseSource: event.courseSource || null,
});

const getCalendarInviteKey = (event, inviterEmail) =>
  [
    "calendar-invite",
    String(event?.id || ""),
    String(event?.date || ""),
    String(event?.title || "").trim(),
    String(inviterEmail || "").trim().toLowerCase(),
  ].join("|");

export default function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const importedCourseRef = useRef("");
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);
  const [routeGuides, setRouteGuides] = useState({});
  const [nearbyIndexes, setNearbyIndexes] = useState({});
  const [nearbyOpenIds, setNearbyOpenIds] = useState({});
  const [dragOverKey, setDragOverKey] = useState("");
  const [courseSearch, setCourseSearch] = useState({});
  const [inviteEvent, setInviteEvent] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitingEmail, setInvitingEmail] = useState("");
  const [activeScheduleTab, setActiveScheduleTab] = useState("upcoming");
  const [certifyingEvent, setCertifyingEvent] = useState(null);
  const [certificationMethod, setCertificationMethod] = useState("PHOTO");
  const [proofImageData, setProofImageData] = useState("");
  const [proofImageMeta, setProofImageMeta] = useState(null);
  const [locationCheckResult, setLocationCheckResult] = useState(null);
  const [certifying, setCertifying] = useState(false);
  const [pageNotice, setPageNotice] = useState("");
  const [reviewPromptTarget, setReviewPromptTarget] = useState(null);

  useEffect(() => {
    const syncEvents = () => {
      setEvents(getCalendarEvents());
    };

    syncEvents();
    window.addEventListener("calendar-events-changed", syncEvents);
    window.addEventListener("storage", syncEvents);

    return () => {
      window.removeEventListener("calendar-events-changed", syncEvents);
      window.removeEventListener("storage", syncEvents);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "past" || tab === "upcoming") {
      setActiveScheduleTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const notice = location.state?.notice;
    if (!notice) return;

    setPageNotice(notice);
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const encodedCourse = params.get("course");
    if (!encodedCourse || importedCourseRef.current === encodedCourse) return;

    importedCourseRef.current = encodedCourse;

    try {
      const sharedEvent = decodeSharedCourse(encodedCourse);
      if (!sharedEvent?.title || !sharedEvent?.date) return;

      const result = addCalendarEvent({
        ...sharedEvent,
        title: `${sharedEvent.title} (공유 코스)`,
        courseSource: sharedEvent.courseSource || {
          title: sharedEvent.title,
          description: sharedEvent.description || "",
          location: sharedEvent.location || "",
        },
      });

      setEvents(result.events);
      alert(result.added ? "공유받은 코스를 내 캘린더에 추가했어요." : "이미 같은 코스가 캘린더에 있어요.");
      navigate("/mypage/calendar", { replace: true });
    } catch (error) {
      console.error("공유 코스 가져오기 실패:", error);
      alert("공유 코스를 불러오지 못했어요.");
      navigate("/mypage/calendar", { replace: true });
    }
  }, [location.search, navigate]);

  const addEvent = (event) => {
    event.preventDefault();

    if (!date || !title.trim()) {
      alert("날짜와 제목을 입력해주세요.");
      return;
    }

    const result = addCalendarEvent({
      date,
      title: title.trim(),
      location: "",
      description: "",
    });

    if (!result.added) {
      alert("같은 일정이 이미 등록되어 있어요.");
      return;
    }

    setEvents(result.events);
    setDate("");
    setTitle("");
  };

  const handleRemoveEvent = (id) => {
    const ok = window.confirm("이 일정을 삭제할까요?");
    if (!ok) return;

    const next = removeCalendarEvent(id);
    setEvents(next);
  };

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isPastSchedule = (event) => String(event?.date || "") <= getTodayDate();

  const updateEventDate = (eventId, nextDate) => {
    const next = updateCalendarEvent(eventId, { date: nextDate });
    setEvents(next);
  };

  const openCertificationModal = (event) => {
    if (!event?.festivalId) {
      alert("행사와 연결된 일정만 방문 인증을 할 수 있어요.");
      return;
    }

    setCertifyingEvent(event);
    setCertificationMethod("PHOTO");
    setProofImageData("");
    setProofImageMeta(null);
    setLocationCheckResult(null);
  };

  const closeCertificationModal = () => {
    if (certifying) return;
    setCertifyingEvent(null);
    setCertificationMethod("PHOTO");
    setProofImageData("");
    setProofImageMeta(null);
    setLocationCheckResult(null);
  };

  const handleProofImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProofImageData("");
      setProofImageMeta(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("사진은 8MB 이하 이미지만 업로드할 수 있어요.");
      event.target.value = "";
      setProofImageData("");
      setProofImageMeta(null);
      return;
    }

    const modifiedAt = new Date(file.lastModified);
    if (!isWithinPhotoDateWindow(modifiedAt, certifyingEvent?.date)) {
      alert("방문일 전후 1일 안에 촬영 또는 저장된 사진만 인증할 수 있어요.");
      event.target.value = "";
      setProofImageData("");
      setProofImageMeta(null);
      return;
    }

    setProofImageMeta({
      name: file.name,
      size: file.size,
      lastModified: modifiedAt.toISOString(),
    });

    const reader = new FileReader();
    reader.onload = () => setProofImageData(String(reader.result || ""));
    reader.onerror = () => alert("이미지를 불러오지 못했어요.");
    reader.readAsDataURL(file);
  };

  const checkEventLocationDistance = async () => {
    if (!certifyingEvent) return null;

    const [currentCoords, eventCoords] = await Promise.all([
      getCurrentCoordinates(),
      getEventCoordinates(certifyingEvent.location),
    ]);
    const distanceMeters = Math.round(getDistanceMeters(currentCoords, eventCoords));
    const passed = distanceMeters <= LOCATION_CERTIFICATION_RADIUS_METERS;

    const result = {
      passed,
      distanceMeters,
      currentCoords,
      eventCoords,
    };
    setLocationCheckResult(result);

    if (!passed) {
      throw new Error(
        `현재 위치가 행사장에서 약 ${(distanceMeters / 1000).toFixed(1)}km 떨어져 있어요. 위치 인증은 행사장 2km 이내에서만 가능해요.`
      );
    }

    return result;
  };

  const verifyPastEvent = async () => {
    if (!certifyingEvent) return;
    if (certificationMethod === "PHOTO" && !proofImageData) {
      alert("사진 인증을 위해 방문일 전후 1일 안에 촬영 또는 저장된 이미지를 업로드해주세요.");
      return;
    }

    try {
      setCertifying(true);

      let verifiedLocationResult = null;
      if (certificationMethod === "LOCATION") {
        verifiedLocationResult = await checkEventLocationDistance();
      }

      await authFetch("/api/me/visited-festivals", {
        method: "POST",
        body: JSON.stringify({
          festivalId: certifyingEvent.festivalId,
          festivalTitle: certifyingEvent.title,
          visitDate: certifyingEvent.date || getTodayDate(),
          verificationMethod: certificationMethod,
          proofImageUrl: certificationMethod === "PHOTO" ? proofImageData : "",
          proofCapturedAt:
            certificationMethod === "PHOTO" && proofImageMeta?.lastModified
              ? proofImageMeta.lastModified
              : "",
          locationDistanceMeters:
            certificationMethod === "LOCATION" && verifiedLocationResult
              ? String(verifiedLocationResult.distanceMeters)
              : "",
        }),
      });

      const next = updateCalendarEvent(certifyingEvent.id, {
        visitedCandidate: true,
        verifiedVisit: true,
        verificationMethod: certificationMethod,
        proofImageUrl: certificationMethod === "PHOTO" ? proofImageData : "",
        proofImageMeta: certificationMethod === "PHOTO" ? proofImageMeta : null,
        locationCheckResult: certificationMethod === "LOCATION" ? verifiedLocationResult : null,
      });
      setEvents(next);
      setReviewPromptTarget({
        targetType: "festival",
        targetId: certifyingEvent.festivalId,
        targetTitle: certifyingEvent.title,
      });
      closeCertificationModal();
    } catch (error) {
      console.error("방문 인증 실패:", error);
      alert(error?.message || "방문 인증에 실패했어요.");
    } finally {
      setCertifying(false);
    }
  };

  const handleOpenEvent = (event) => {
    if (event?.festivalId) {
      navigate(`/detail/${event.festivalId}`);
      return;
    }

    if (event?.communityType && event?.communityId) {
      navigate(`/community/${event.communityType}/${event.communityId}`);
    }
  };

  const canOpenEventSource = (event) =>
    Boolean(event?.festivalId || (event?.communityType && event?.communityId));

  const normalizeFestival = (item) => ({
    ...item,
    thumbnail_url: item.thumbnail_url ?? item.thumbnailUrl ?? "",
    start_date: item.start_date ?? item.startDate ?? "",
    end_date: item.end_date ?? item.endDate ?? "",
  });

  const normalizeSearchText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^0-9a-z\uac00-\ud7a3]/g, "");

  const getSearchTokens = (query) =>
    String(query || "")
      .trim()
      .split(/\s+/)
      .map(normalizeSearchText)
      .filter(Boolean);

  const getRequiredSearchTokens = (tokens) => {
    const optionalTokens = new Set(["놀거리", "행사", "축제", "전시", "공연", "문화", "추천"]);
    const requiredTokens = tokens.filter((token) => !optionalTokens.has(token));
    return requiredTokens.length > 0 ? requiredTokens : tokens;
  };

  const getFestivalSearchText = (festival) =>
    normalizeSearchText(
      [
        festival.title,
        festival.region,
        festival.location,
        festival.category,
        festival.description,
      ]
        .filter(Boolean)
        .join(" ")
    );

  const getFestivalUniqueKey = (festival) =>
    [
      normalizeSearchText(festival.title),
      normalizeSearchText(festival.region),
      normalizeSearchText(festival.location),
    ]
      .filter(Boolean)
      .join("|");

  const dedupeFestivals = (festivals) => {
    const seen = new Set();
    return festivals.filter((festival) => {
      const key = getFestivalUniqueKey(festival);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const formatTimeInput = (value) => {
    const digits = String(value || "").replace(/[^\d]/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const cleanCourseText = (value, fallback = "") => {
    const text = String(value || "");
    if (!text.trim()) return fallback;
    const suspiciousCharCount = Array.from(text).filter((char) => {
      const code = char.charCodeAt(0);
      return char === "\uFFFD" || (code >= 0x4e00 && code <= 0x9fff);
    }).length;
    if (suspiciousCharCount >= 2) {
      return fallback || "하루 코스 일정입니다.";
    }
    return text;
  };

  const loadNearbyFestivalsIfNeeded = async (event) => {
    if (!event?.festivalId || (Array.isArray(event.nearbyFestivals) && event.nearbyFestivals.length >= 6)) {
      return;
    }

    try {
      const data = await authFetch("/api/ai/recommend", {
        method: "POST",
        body: JSON.stringify({
          query: `${event.title || "행사"} 하루 코스`,
          targetFestivalId: event.festivalId,
          limit: 1,
        }),
      });

      const nearbyFestivals = Array.isArray(data?.nearbyFestivals)
        ? data.nearbyFestivals.map(normalizeFestival)
        : [];

      if (nearbyFestivals.length === 0) return;

      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? {
                ...item,
                nearbyFestivals,
              }
            : item
        )
      );
    } catch (error) {
      console.error("인근 문화행사 후보 불러오기 실패:", error);
    }
  };

  const toggleDetail = (event) => {
    const id = event.id;
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    if (!expandedIds.includes(id)) {
      loadNearbyFestivalsIfNeeded(event);
    }
  };

  const buildMapSearchUrl = (keyword) =>
    `https://map.naver.com/p/search/${encodeURIComponent(keyword || "")}`;

  const getEventArea = (event) => {
    const location = String(event?.location || "").trim();
    const parts = location.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
    return location || "행사장 주변";
  };

  const buildEventItinerary = (event) => {
    const area = getEventArea(event);
    const eventLocation = event?.location || area;
    const eventTitle = event?.title || "문화행사";

    return [
      {
        time: "10:30",
        title: "근처 카페에서 출발 준비",
        description: "행사장 주변 카페에서 만나 이동 동선과 예매 정보를 확인해요.",
        location: `${area} 카페`,
        mapUrl: buildMapSearchUrl(`${area} 카페`),
      },
      {
        time: "12:00",
        title: "점심 식사",
        description: "행사장과 가까운 식당을 골라 대기 시간을 줄이는 코스예요.",
        location: `${area} 맛집`,
        mapUrl: buildMapSearchUrl(`${area} 맛집`),
      },
      {
        time: "14:00",
        title: `${eventTitle} 관람`,
        description: "저장한 문화행사를 메인 일정으로 잡았어요.",
        location: eventLocation,
        mapUrl: buildMapSearchUrl(eventTitle || eventLocation),
        festivalId: event?.festivalId || null,
      },
      {
        time: "17:00",
        title: "주변 산책 또는 근처 행사 둘러보기",
        description: "관람 후 주변 장소나 인근 문화행사를 가볍게 이어서 둘러봐요.",
        location: `${area} 문화행사`,
        mapUrl: buildMapSearchUrl(`${area} 문화행사`),
      },
      {
        time: "19:00",
        title: "저녁 식사 후 귀가",
        description: "저녁 장소까지 잡아 하루 코스로 마무리해요.",
        location: `${area} 저녁 맛집`,
        mapUrl: buildMapSearchUrl(`${area} 저녁 맛집`),
      },
    ];
  };

  const createCourseFromEvent = (event) => {
    const courseSource = event.courseSource || {
      title: event.title || "문화행사",
      description: event.description || "",
      location: event.location || "",
    };
    const courseTitle = event.title?.includes("하루 코스")
      ? event.title
      : `${event.title || "문화행사"} 하루 코스`;

    const next = events.map((item) =>
      item.id === event.id
        ? {
            ...item,
            title: courseTitle,
            description: item.description || "캘린더 일정에서 만든 하루 코스",
            courseSource,
            itineraryItems: buildEventItinerary(item),
          }
        : item
    );

    setEvents(next);
    saveCalendarEvents(next);
    setExpandedIds((prev) => (prev.includes(event.id) ? prev : [...prev, event.id]));
    loadNearbyFestivalsIfNeeded({ ...event, itineraryItems: buildEventItinerary(event) });
  };

  const cancelCourseFromEvent = (event) => {
    const ok = window.confirm("하루 코스를 취소하고 단일 일정으로 되돌릴까요?");
    if (!ok) return;

    const source = event.courseSource || {};
    const next = events.map((item) =>
      item.id === event.id
        ? {
            ...item,
            title: source.title || item.title.replace(/\s*하루 코스$/, ""),
            description: source.description || "",
            location: source.location || item.location || "",
            itineraryItems: [],
            nearbyFestivals: [],
            courseSource: null,
          }
        : item
    );

    setEvents(next);
    saveCalendarEvents(next);
    setExpandedIds((prev) => prev.filter((id) => id !== event.id));
  };

  const shareCalendarEvent = async (event) => {
    const isCourse = Array.isArray(event.itineraryItems) && event.itineraryItems.length > 0;
    const shareUrl = isCourse
      ? `${window.location.origin}/mypage/calendar?course=${encodeURIComponent(encodeSharedCourse(event))}`
      : event.festivalId
        ? `${window.location.origin}/detail/${event.festivalId}`
        : window.location.href;
    const lines = [
      event.title,
      event.date,
      event.location ? `장소: ${event.location}` : "",
      event.festivalPeriod ? `기간: ${event.festivalPeriod}` : "",
      isCourse ? "링크를 열면 캘린더에 코스를 가져올 수 있어요." : "",
      shareUrl,
    ].filter(Boolean);

    const shareText = lines.join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title || "문화행사 일정",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        console.warn("브라우저 공유 API 실패, 링크 복사로 전환:", error);
      }
    }

    try {
      const copied = await copyTextToClipboard(shareText);
      if (!copied) throw new Error("copy_failed");
      alert("공유 내용을 클립보드에 복사했어요.");
    } catch (error) {
      console.error("일정 공유 실패:", error);
      alert("공유에 실패했어요. 다시 시도해주세요.");
    }
  };

  const openInviteModal = async (event) => {
    const currentEmail = getStoredEmail();
    if (!currentEmail) {
      alert("로그인 후 동행자를 초대할 수 있어요.");
      navigate("/login");
      return;
    }

    setInviteEvent(event);
    setFollowingUsers([]);
    setInviteLoading(true);

    try {
      const users = await authFetch(`/api/users/${encodeURIComponent(currentEmail)}/following`);
      setFollowingUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error("팔로잉 목록 불러오기 실패:", error);
      setFollowingUsers([]);
    } finally {
      setInviteLoading(false);
    }
  };

  const closeInviteModal = () => {
    setInviteEvent(null);
    setFollowingUsers([]);
    setInvitingEmail("");
  };

  const inviteCompanion = (user) => {
    if (!inviteEvent || !user?.email || invitingEmail) return;

    const inviterEmail = getStoredEmail();
    const inviterName = getDisplayName({
      email: inviterEmail,
      nickname: getStoredNickname(),
    });
    const inviteKey = getCalendarInviteKey(inviteEvent, inviterEmail);
    const duplicatedInvite = findNotification(
      user.email,
      (notification) =>
        notification.type === "calendar-invite" &&
        notification.inviteKey === inviteKey &&
        notification.inviteStatus !== "declined"
    );

    if (duplicatedInvite) {
      alert(`${user.nickname || user.email}님에게 이미 보낸 일정 초대가 있어요.`);
      closeInviteModal();
      return;
    }

    setInvitingEmail(user.email);
    addNotification(user.email, {
      type: "calendar-invite",
      inviteKey,
      title: "행사 일정에 초대되었습니다.",
      message: `${inviterName}님이 "${inviteEvent.title}" 일정에 초대했어요.`,
      actionLabel: "수락 / 거절",
      inviteStatus: "pending",
      inviterEmail,
      inviterName,
      event: buildInviteEvent(inviteEvent),
    });

    setInvitingEmail("");
    alert(`${user.nickname || user.email}님에게 일정 초대를 보냈어요.`);
    closeInviteModal();
  };

  const selectNearbyFestival = (eventId, festival) => {
    const location = [festival.region, festival.location].filter(Boolean).join(" ").trim();
    const next = events.map((event) => {
      if (event.id !== eventId) return event;

      return {
        ...event,
        itineraryItems: event.itineraryItems.map((item) =>
          item.time === "17:00"
            ? {
                ...item,
                title: festival.title,
                description: "선택한 인근 문화행사를 하루 코스에 추가했어요.",
                location,
                mapUrl: buildMapSearchUrl(festival.title || location),
                festivalId: festival.id,
              }
            : item
        ),
      };
    });

    setEvents(next);
    saveCalendarEvents(next);
  };

  const updateEventItinerary = (eventId, updater) => {
    const next = events.map((event) => {
      if (event.id !== eventId) return event;
      return {
        ...event,
        itineraryItems: updater(Array.isArray(event.itineraryItems) ? event.itineraryItems : []),
      };
    });

    setEvents(next);
    saveCalendarEvents(next);
  };

  const removeItineraryItem = (eventId, itemIndex) => {
    const ok = window.confirm("이 코스를 삭제할까요?");
    if (!ok) return;

    updateEventItinerary(eventId, (items) => items.filter((_, index) => index !== itemIndex));
  };

  const searchCourseFestivals = async (eventId) => {
    const keyword = String(courseSearch[eventId]?.query || "").trim();
    if (!keyword) {
      alert("추가할 행사나 장소 키워드를 입력해주세요.");
      return;
    }

    setCourseSearch((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        loading: true,
        results: [],
        page: 0,
        searched: true,
      },
    }));

    try {
      const tokens = getSearchTokens(keyword);
      const data = await authFetch("/api/festivals?status=ongoing");
      const source = Array.isArray(data) ? data.map(normalizeFestival) : [];
      let filtered = source.filter((festival) => {
        const haystack = getFestivalSearchText(festival);
        return tokens.every((token) => haystack.includes(token));
      });

      if (filtered.length === 0 && tokens.length > 1) {
        const requiredTokens = getRequiredSearchTokens(tokens);
        filtered = source.filter((festival) => {
          const haystack = getFestivalSearchText(festival);
          return requiredTokens.every((token) => haystack.includes(token));
        });
      }

      const results = dedupeFestivals(filtered).slice(0, 30);

      setCourseSearch((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          loading: false,
          results,
          page: 0,
          searched: true,
        },
      }));
    } catch (error) {
      console.error("코스 추가 행사 검색 실패:", error);
      setCourseSearch((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          loading: false,
          results: [],
          page: 0,
          searched: true,
        },
      }));
      alert("행사 검색에 실패했어요.");
    }
  };

  const addFestivalToCourse = (eventId, festival) => {
    const location = [festival.region, festival.location].filter(Boolean).join(" ").trim();
    updateEventItinerary(eventId, (items) => {
      const festivalKey = getFestivalUniqueKey(festival);
      const festivalTitle = normalizeSearchText(festival.title);
      const festivalLocation = normalizeSearchText(location);
      const alreadyAdded = items.some((item) => {
        if (festival.id && item.festivalId === festival.id) return true;
        const itemTitle = normalizeSearchText(item.title);
        const itemLocation = normalizeSearchText(item.location);
        if (itemTitle && itemTitle === festivalTitle && itemLocation && festivalLocation) {
          return itemLocation.includes(festivalLocation) || festivalLocation.includes(itemLocation);
        }
        return (
          getFestivalUniqueKey({
            title: item.title,
            region: "",
            location: item.location,
          }) === festivalKey
        );
      });

      if (alreadyAdded) {
        alert("이미 코스에 추가된 행사예요.");
        return items;
      }

      return [
        ...items,
        {
          time: "17:00",
          title: festival.title || "추가한 행사",
          description: "검색해서 하루 코스에 추가한 문화행사예요.",
          location,
          mapUrl: buildMapSearchUrl(festival.title || location),
          festivalId: festival.id || null,
          fromCourseSearch: true,
        },
      ];
    });
  };

  const updateItineraryTime = (eventId, itemIndex, value) => {
    updateEventItinerary(eventId, (items) =>
      items.map((item, index) => (index === itemIndex ? { ...item, time: value } : item))
    );
  };

  const moveItineraryItem = (eventId, fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    updateEventItinerary(eventId, (items) => {
      const next = [...items];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return items;
      next.splice(toIndex, 0, moved);
      return next;
    });
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
          origin: "현재 위치 또는 목적지 좌표를 확인할 수 없어요.",
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

  const changeCourseSearchPage = (eventId, direction) => {
    setCourseSearch((prev) => {
      const currentState = prev[eventId] || {};
      const total = Array.isArray(currentState.results) ? currentState.results.length : 0;
      const pageCount = Math.max(Math.ceil(total / 3), 1);
      const current = currentState.page || 0;
      return {
        ...prev,
        [eventId]: {
          ...currentState,
          page: (current + direction + pageCount) % pageCount,
        },
      };
    });
  };

  const toggleNearbyOpen = (key) => {
    setNearbyOpenIds((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  };

  const visibleEvents = events.filter((event) =>
    activeScheduleTab === "past" ? isPastSchedule(event) : !isPastSchedule(event)
  );

  return (
    <div className="mypage-main-panel">
      <h2 className="mypage-section-title">캘린더 일정</h2>

      {pageNotice ? (
        <div style={pageNoticeStyle}>
          <span>{pageNotice}</span>
          <button type="button" style={noticeCloseButtonStyle} onClick={() => setPageNotice("")}>
            닫기
          </button>
        </div>
      ) : null}

      <div style={scheduleTabStyle}>
        <button
          type="button"
          style={activeScheduleTab === "upcoming" ? scheduleTabActiveStyle : scheduleTabButtonStyle}
          onClick={() => setActiveScheduleTab("upcoming")}
        >
          예정 일정 {events.filter((event) => !isPastSchedule(event)).length}
        </button>
        <button
          type="button"
          style={activeScheduleTab === "past" ? scheduleTabActiveStyle : scheduleTabButtonStyle}
          onClick={() => setActiveScheduleTab("past")}
        >
          지난 일정 {events.filter(isPastSchedule).length}
        </button>
      </div>

      <form onSubmit={addEvent} style={{ display: "flex", gap: 8 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="submit" style={btnStyle}>
          추가
        </button>
      </form>

      <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
        {visibleEvents.length === 0 ? (
          <div style={{ padding: 16, color: "#6b7280" }}>
            {activeScheduleTab === "past" ? "지난 일정이 없어요." : "예정 일정이 없어요."}
          </div>
        ) : (
          visibleEvents.map((ev) => {
            const hasSource = canOpenEventSource(ev);

            return (
            <div
              key={ev.id}
              role={hasSource ? "button" : undefined}
              tabIndex={hasSource ? 0 : undefined}
              onClick={() => {
                if (hasSource) handleOpenEvent(ev);
              }}
              onKeyDown={(event) => {
                if (!hasSource) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenEvent(ev);
                }
              }}
              style={{
                border: "1px solid #f1e4ee",
                borderRadius: 12,
                padding: 12,
                cursor: hasSource ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                  <input
                    type="date"
                    value={ev.date || ""}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => updateEventDate(ev.id, event.target.value)}
                    style={{
                      ...inputStyle,
                      height: 30,
                      marginTop: 6,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  />

                  {ev.location ? (
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                      장소 {ev.location}
                    </div>
                  ) : null}

                  {ev.festivalPeriod ? (
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                      행사 기간 {ev.festivalPeriod}
                    </div>
                  ) : null}

                  {Array.isArray(ev.companions) && ev.companions.length > 0 ? (
                    <div style={{ fontSize: 13, color: "#ff538b", marginTop: 4, fontWeight: 700 }}>
                      동행자 {ev.companions.map((item) => item.nickname || item.email).join(", ")}
                    </div>
                  ) : null}

                  {ev.verifiedVisit ? (
                    <div style={{ fontSize: 13, color: "#ff538b", marginTop: 4, fontWeight: 800 }}>
                      방문 인증 완료
                    </div>
                  ) : null}
                </div>

                <div
                  style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {ev?.festivalId && (!Array.isArray(ev.itineraryItems) || ev.itineraryItems.length === 0) ? (
                    <button
                      type="button"
                      onClick={() => createCourseFromEvent(ev)}
                      style={{
                        ...btnSmallStyle,
                        background: "#fff3f8",
                        color: "#ff538b",
                      }}
                    >
                      하루코스
                    </button>
                  ) : null}

                  {activeScheduleTab === "past" && ev?.festivalId ? (
                    ev.verifiedVisit ? (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/mypage/reviews/new?targetType=festival&targetId=${encodeURIComponent(ev.festivalId)}&targetTitle=${encodeURIComponent(ev.title)}`,
                            {
                              state: {
                                targetType: "festival",
                                targetId: ev.festivalId,
                                targetTitle: ev.title,
                              },
                            }
                          )
                        }
                        style={btnSmallStyle}
                      >
                        후기 쓰기
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openCertificationModal(ev)}
                        style={{
                          ...btnSmallStyle,
                          background: "#ff538b",
                          color: "#fff",
                        }}
                      >
                        인증하기
                      </button>
                    )
                  ) : null}

                  {Array.isArray(ev.itineraryItems) && ev.itineraryItems.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => toggleDetail(ev)}
                      style={btnSmallStyle}
                    >
                      {expandedIds.includes(ev.id) ? "접기" : "상세보기"}
                    </button>
                  ) : null}

                  {Array.isArray(ev.itineraryItems) && ev.itineraryItems.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => cancelCourseFromEvent(ev)}
                      style={{
                        ...btnSmallStyle,
                        border: "1px solid #f1e4ee",
                        background: "#fff",
                        color: "#6b7280",
                      }}
                    >
                      코스 취소
                    </button>
                  ) : null}

                  {Array.isArray(ev.itineraryItems) && ev.itineraryItems.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => openInviteModal(ev)}
                      style={btnSmallStyle}
                    >
                      동행자 추가
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => shareCalendarEvent(ev)}
                      style={btnSmallStyle}
                    >
                      공유
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(ev.id)}
                    style={{
                      ...btnSmallStyle,
                      border: "1px solid #f1e4ee",
                      color: "#6b7280",
                      background: "#fff",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>

              {expandedIds.includes(ev.id) && Array.isArray(ev.itineraryItems) ? (
                <div
                  style={{ marginTop: 14, display: "grid", gap: 10 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {ev.itineraryItems.map((item, index) => (
                    <div
                      key={`${ev.id}-${item.time}-${index}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(index));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnter={() => setDragOverKey(`${ev.id}-${item.time}-${index}`)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        moveItineraryItem(ev.id, Number(e.dataTransfer.getData("text/plain")), index);
                        setDragOverKey("");
                      }}
                      onDragEnd={() => setDragOverKey("")}
                      style={{
                        ...itineraryCardStyle,
                        ...(dragOverKey === `${ev.id}-${item.time}-${index}` ? itineraryCardActiveStyle : {}),
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "82px minmax(0, 1fr)",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="07:00"
                          maxLength={5}
                          value={item.time || ""}
                          onChange={(e) => updateItineraryTime(ev.id, index, formatTimeInput(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={(e) => e.preventDefault()}
                          style={{
                            height: 28,
                            width: 72,
                            minWidth: 72,
                            boxSizing: "border-box",
                            borderRadius: 999,
                            border: "none",
                            background: "#eef1ff",
                            color: "#3f46c8",
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "text",
                            padding: "0 8px",
                          }}
                        />
                        <div>
                          <div style={itineraryTitleRowStyle}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                            <button
                              type="button"
                              style={deleteCourseButtonStyle}
                              onClick={() => removeItineraryItem(ev.id, index)}
                            >
                              삭제
                            </button>
                          </div>
                          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                            {cleanCourseText(
                              item.description,
                              item.fromCourseSearch
                                ? "검색해서 하루 코스에 추가한 문화행사예요."
                                : "하루 코스 일정입니다."
                            )}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                            {item.location}
                          </div>
                          {item.mapUrl || item.location ? (
                            <div style={scheduleActionRowStyle}>
                              {item.mapUrl ? (
                                <button
                                  type="button"
                                  style={btnSmallStyle}
                                  onClick={() => window.open(item.mapUrl, "_blank", "noopener,noreferrer")}
                                >
                                  지도에서 보기
                                </button>
                              ) : null}
                              {item.location ? (
                                <button
                                  type="button"
                                  style={{
                                    ...btnSmallStyle,
                                    background: "#fff7fb",
                                    color: "#ff5c8a",
                                  }}
                                  onClick={() =>
                                    showRouteGuide(`${ev.id}-${item.time}-${index}`, item.location)
                                  }
                                >
                                  내 위치에서 길안내
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {routeGuides[`${ev.id}-${item.time}-${index}`] ? (
                        <div style={routeGuideStyle}>
                          <div style={{ fontWeight: 800, color: "#313a8f", marginBottom: 8 }}>
                            길안내
                          </div>
                          <div style={routeLineStyle}>
                            <span>출발</span>
                            <strong>{routeGuides[`${ev.id}-${item.time}-${index}`].origin}</strong>
                          </div>
                          <div style={routeLineStyle}>
                            <span>도착</span>
                            <strong>{routeGuides[`${ev.id}-${item.time}-${index}`].destination}</strong>
                          </div>
                          <div style={{ display: "grid", gap: 4, marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                            {routeGuides[`${ev.id}-${item.time}-${index}`].status === "ready" ? (
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
                            style={{ ...btnSmallStyle, marginTop: 10 }}
                            onClick={() =>
                              window.open(
                                routeGuides[`${ev.id}-${item.time}-${index}`].naverUrl,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            {routeGuides[`${ev.id}-${item.time}-${index}`].status === "ready"
                              ? "네이버 지도에서 경로 확인"
                              : "도착지 지도에서 검색"}
                          </button>
                        </div>
                      ) : null}

                      {item.time === "17:00" &&
                      !item.fromCourseSearch &&
                      !String(item.description || "").includes("검색해서") &&
                      Array.isArray(ev.nearbyFestivals) &&
                      ev.nearbyFestivals.length > 0 ? (
                        <div style={nearbyWrapStyle}>
                          {(() => {
                            const key = `${ev.id}-nearby`;
                            const isNearbyOpen = nearbyOpenIds[key] ?? true;
                            const pageIndex = nearbyIndexes[key] || 0;
                            const nearbyFestivals = dedupeFestivals(
                              ev.nearbyFestivals.map(normalizeFestival)
                            );
                            const pageCount = Math.max(Math.ceil(nearbyFestivals.length / 3), 1);
                            const visibleFestivals = nearbyFestivals.slice(pageIndex * 3, pageIndex * 3 + 3);

                            return (
                              <>
                                <div style={nearbyHeaderStyle}>
                                  <div style={{ fontWeight: 800 }}>인근 문화행사 후보</div>
                                  <button
                                    type="button"
                                    style={pagerButtonStyle}
                                    onClick={() => toggleNearbyOpen(key)}
                                  >
                                    {isNearbyOpen ? "닫기" : "열기"}
                                  </button>
                                </div>

                                {isNearbyOpen ? (
                                  <>
                                    <div style={{ display: "grid", gap: 10 }}>
                                      {visibleFestivals.map((festival) => (
                                        <div key={festival.id} style={nearbyCardStyle}>
                                          {festival.thumbnail_url || festival.thumbnailUrl ? (
                                            <img
                                              src={festival.thumbnail_url || festival.thumbnailUrl}
                                              alt={festival.title}
                                              style={{
                                                width: 72,
                                                height: 72,
                                                borderRadius: 10,
                                                objectFit: "cover",
                                                background: "#f3f4f6",
                                                flexShrink: 0,
                                              }}
                                            />
                                          ) : null}
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 800 }}>{festival.title}</div>
                                            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                                              {festival.start_date || festival.startDate} - {festival.end_date || festival.endDate}
                                            </div>
                                            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                                              {festival.region} {festival.location}
                                            </div>
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                                              <button
                                                type="button"
                                                style={btnSmallStyle}
                                                onClick={() => navigate(`/detail/${festival.id}`)}
                                              >
                                                상세페이지
                                              </button>
                                              <button
                                                type="button"
                                                style={{
                                                  ...btnSmallStyle,
                                                  background: "#fff3f8",
                                                  color: "#ff538b",
                                                }}
                                                onClick={() => selectNearbyFestival(ev.id, festival)}
                                              >
                                                선택
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <div style={nearbyPagerStyle}>
                                      <button
                                        type="button"
                                        style={pagerButtonStyle}
                                        onClick={() => changeNearbyIndex(key, nearbyFestivals.length, -1)}
                                      >
                                        이전 추천
                                      </button>
                                      <span>{pageIndex + 1} / {pageCount}</span>
                                      <button
                                        type="button"
                                        style={pagerButtonStyle}
                                        onClick={() => changeNearbyIndex(key, nearbyFestivals.length, 1)}
                                      >
                                        다음 추천
                                      </button>
                                    </div>
                                  </>
                                ) : null}
                              </>
                            );
                          })()}
                        </div>
                      ) : null}
                    </div>
                  ))}

                  <div style={courseSearchBoxStyle}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>코스에 행사 추가</div>
                    <div style={courseSearchRowStyle}>
                      <input
                        value={courseSearch[ev.id]?.query || ""}
                        onChange={(e) =>
                          setCourseSearch((prev) => ({
                            ...prev,
                            [ev.id]: {
                              ...prev[ev.id],
                              query: e.target.value,
                            },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            searchCourseFestivals(ev.id);
                          }
                        }}
                        placeholder="예) 강남 전시, 성수 행사, 홍대 공연"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        style={btnSmallStyle}
                        onClick={() => searchCourseFestivals(ev.id)}
                      >
                        검색
                      </button>
                    </div>

                    {courseSearch[ev.id]?.loading ? (
                      <div style={courseSearchHintStyle}>검색 중이에요...</div>
                    ) : null}

                    {Array.isArray(courseSearch[ev.id]?.results) && courseSearch[ev.id].results.length > 0 ? (
                      <div style={courseSearchResultsStyle}>
                        {courseSearch[ev.id].results
                          .slice((courseSearch[ev.id].page || 0) * 3, (courseSearch[ev.id].page || 0) * 3 + 3)
                          .map((festival) => (
                          <div key={getFestivalUniqueKey(festival)} style={courseSearchResultCardStyle}>
                            {festival.thumbnail_url || festival.thumbnailUrl ? (
                              <img
                                src={festival.thumbnail_url || festival.thumbnailUrl}
                                alt={festival.title}
                                style={courseSearchImageStyle}
                              />
                            ) : null}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 800 }}>{festival.title}</div>
                              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                                {festival.region} {festival.location}
                              </div>
                            </div>
                            <button
                              type="button"
                              style={btnSmallStyle}
                              onClick={() => addFestivalToCourse(ev.id, festival)}
                            >
                              추가
                            </button>
                          </div>
                        ))}
                        {courseSearch[ev.id].results.length > 3 ? (
                          <div style={nearbyPagerStyle}>
                            <button
                              type="button"
                              style={pagerButtonStyle}
                              onClick={() => changeCourseSearchPage(ev.id, -1)}
                            >
                              이전
                            </button>
                            <span>
                              {(courseSearch[ev.id].page || 0) + 1} / {Math.ceil(courseSearch[ev.id].results.length / 3)}
                            </span>
                            <button
                              type="button"
                              style={pagerButtonStyle}
                              onClick={() => changeCourseSearchPage(ev.id, 1)}
                            >
                              다음
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {!courseSearch[ev.id]?.loading &&
                    courseSearch[ev.id]?.searched &&
                    Array.isArray(courseSearch[ev.id]?.results) &&
                    courseSearch[ev.id].results.length === 0 ? (
                      <div style={courseSearchHintStyle}>조건에 맞는 검색 결과가 없어요.</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
          })
        )}
      </div>

      {certifyingEvent ? (
        <div style={inviteModalBackdropStyle} onClick={closeCertificationModal}>
          <div style={inviteModalStyle} onClick={(event) => event.stopPropagation()}>
            <div style={inviteModalHeaderStyle}>
              <div>
                <div style={inviteModalTitleStyle}>방문 인증</div>
                <div style={inviteModalSubStyle}>
                  지난 일정으로 등록된 행사를 인증한 뒤 별점과 후기를 남길 수 있어요.
                </div>
              </div>
              <button type="button" style={pagerButtonStyle} onClick={closeCertificationModal}>
                닫기
              </button>
            </div>

            <div style={inviteEventBoxStyle}>
              <strong>{certifyingEvent.title}</strong>
              <span>{certifyingEvent.date}</span>
              {certifyingEvent.location ? <span>{certifyingEvent.location}</span> : null}
            </div>

            <div style={certificationMethodGridStyle}>
              {[
                ["PHOTO", "사진 인증", "방문일 전후 1일 안에 촬영·저장된 이미지"],
                ["LOCATION", "위치 인증", "행사장 2km 이내에서 현재 위치 확인"],
              ].map(([value, label, desc]) => (
                <button
                  key={value}
                  type="button"
                  style={
                    certificationMethod === value
                      ? certificationMethodActiveStyle
                      : certificationMethodButtonStyle
                  }
                  onClick={() => setCertificationMethod(value)}
                >
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </button>
              ))}
            </div>

            {certificationMethod === "PHOTO" ? (
              <div style={proofUploadBoxStyle}>
                <input type="file" accept="image/*" onChange={handleProofImageChange} />
                {proofImageData ? (
                  <>
                    <img src={proofImageData} alt="방문 인증 미리보기" style={proofPreviewStyle} />
                    {proofImageMeta ? (
                      <div style={certificationHintStyle}>
                        {proofImageMeta.name} · {new Date(proofImageMeta.lastModified).toLocaleDateString()}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div style={courseSearchHintStyle}>
                    방문일 {certifyingEvent.date} 전후 1일 안에 촬영 또는 저장된 사진만 인증돼요.
                  </div>
                )}
              </div>
            ) : null}

            {certificationMethod === "LOCATION" ? (
              <div style={proofUploadBoxStyle}>
                <div style={courseSearchHintStyle}>
                  브라우저 위치 권한을 허용하면 행사장 주소와 현재 위치의 거리를 계산해요. 2km 이내일 때만 인증됩니다.
                </div>
                {locationCheckResult ? (
                  <div style={certificationHintStyle}>
                    마지막 확인 거리 약 {(locationCheckResult.distanceMeters / 1000).toFixed(1)}km
                  </div>
                ) : null}
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button type="button" style={deleteCourseButtonStyle} onClick={closeCertificationModal}>
                취소
              </button>
              <button
                type="button"
                style={{ ...btnSmallStyle, height: 36, background: "#ff538b", color: "#fff" }}
                onClick={verifyPastEvent}
                disabled={certifying}
              >
                {certifying ? "인증 중" : "인증 완료"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewPromptTarget ? (
        <div style={inviteModalBackdropStyle} onClick={() => setReviewPromptTarget(null)}>
          <div style={reviewPromptModalStyle} onClick={(event) => event.stopPropagation()}>
            <div style={inviteModalTitleStyle}>인증되었어요</div>
            <div style={inviteModalSubStyle}>별점과 후기를 남기시겠습니까?</div>
            <div style={reviewPromptActionStyle}>
              <button
                type="button"
                style={deleteCourseButtonStyle}
                onClick={() => setReviewPromptTarget(null)}
              >
                아니오
              </button>
              <button
                type="button"
                style={{ ...btnSmallStyle, height: 36, background: "#ff538b", color: "#fff" }}
                onClick={() => {
                  const target = reviewPromptTarget;
                  setReviewPromptTarget(null);
                  navigate(
                    `/mypage/reviews/new?targetType=${encodeURIComponent(target.targetType)}&targetId=${encodeURIComponent(target.targetId)}&targetTitle=${encodeURIComponent(target.targetTitle)}`,
                    { state: target }
                  );
                }}
              >
                예, 후기 작성
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {inviteEvent ? (
        <div style={inviteModalBackdropStyle} onClick={closeInviteModal}>
          <div style={inviteModalStyle} onClick={(event) => event.stopPropagation()}>
            <div style={inviteModalHeaderStyle}>
              <div>
                <div style={inviteModalTitleStyle}>동행자 추가</div>
                <div style={inviteModalSubStyle}>
                  팔로잉한 친구에게 일정 초대를 보낼 수 있어요.
                </div>
              </div>
              <button type="button" style={pagerButtonStyle} onClick={closeInviteModal}>
                닫기
              </button>
            </div>

            <div style={inviteEventBoxStyle}>
              <strong>{inviteEvent.title}</strong>
              <span>{inviteEvent.date}</span>
            </div>

            {inviteLoading ? (
              <div style={inviteEmptyStyle}>팔로잉 목록을 불러오는 중이에요.</div>
            ) : followingUsers.length === 0 ? (
              <div style={inviteEmptyStyle}>초대할 팔로잉 친구가 없어요.</div>
            ) : (
              <div style={inviteListStyle}>
                {followingUsers.map((user) => (
                  <div key={user.email} style={inviteUserStyle}>
                    <div style={inviteAvatarStyle}>
                      {(user.nickname || user.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{user.nickname || user.email}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{user.email}</div>
                    </div>
                    <button
                      type="button"
                      style={btnSmallStyle}
                      onClick={() => inviteCompanion(user)}
                      disabled={invitingEmail === user.email}
                    >
                      {invitingEmail === user.email ? "초대 중" : "초대"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const inputStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #f1e4ee",
  padding: "0 12px",
  outline: "none",
};

const btnStyle = {
  height: 38,
  borderRadius: 10,
  border: "1px solid #ffc3da",
  background: "#fff3f8",
  color: "#ff538b",
  cursor: "pointer",
  padding: "0 14px",
};

const btnSmallStyle = {
  height: 32,
  borderRadius: 10,
  border: "1px solid #ffd3e3",
  background: "#fff9fc",
  color: "#f56a92",
  cursor: "pointer",
  whiteSpace: "nowrap",
  padding: "0 12px",
  fontWeight: 700,
};

const scheduleTabStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 14,
  borderBottom: "1px solid #ffd3e1",
};

const pageNoticeStyle = {
  marginBottom: 14,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #ffd3e1",
  background: "#fff7fb",
  color: "#d14b72",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  fontWeight: 700,
};

const noticeCloseButtonStyle = {
  border: 0,
  background: "transparent",
  color: "#ff538b",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const scheduleTabButtonStyle = {
  height: 38,
  border: 0,
  borderBottom: "2px solid transparent",
  background: "transparent",
  color: "#6b7280",
  fontWeight: 800,
  cursor: "pointer",
  padding: "0 12px",
};

const scheduleTabActiveStyle = {
  ...scheduleTabButtonStyle,
  color: "#ff538b",
  borderBottom: "2px solid #ff538b",
};

const certificationMethodGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 8,
};

const certificationMethodButtonStyle = {
  minHeight: 82,
  borderRadius: 14,
  border: "1px solid #f1e4ee",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  padding: 12,
  textAlign: "left",
  display: "grid",
  gap: 6,
};

const certificationMethodActiveStyle = {
  ...certificationMethodButtonStyle,
  border: "1px solid #ff9fc2",
  background: "#fff3f8",
  color: "#ff538b",
};

const proofUploadBoxStyle = {
  marginTop: 12,
  padding: 12,
  border: "1px dashed #ffc3da",
  borderRadius: 14,
  background: "#fffafd",
};

const proofPreviewStyle = {
  width: "100%",
  maxHeight: 220,
  objectFit: "cover",
  borderRadius: 12,
  marginTop: 10,
  border: "1px solid #f1e4ee",
};

const certificationHintStyle = {
  marginTop: 8,
  padding: "8px 10px",
  borderRadius: 10,
  background: "#fff3f8",
  color: "#d14b72",
  fontSize: 13,
  fontWeight: 700,
};

const reviewPromptModalStyle = {
  width: "min(380px, 100%)",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #ffd3e1",
  boxShadow: "0 24px 60px rgba(17, 24, 39, 0.22)",
  padding: 20,
};

const reviewPromptActionStyle = {
  marginTop: 18,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const itineraryCardStyle = {
  cursor: "grab",
  padding: 12,
  border: "1px solid #f4dce8",
  borderRadius: 12,
  background: "#fff",
  boxShadow: "0 4px 14px rgba(255, 120, 160, 0.08)",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
};

const itineraryCardActiveStyle = {
  border: "1px solid #ff9fc2",
  background: "#fff7fb",
  boxShadow: "0 8px 20px rgba(255, 92, 138, 0.14)",
  transform: "translateY(-1px)",
};

const scheduleActionRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 10,
};

const itineraryTitleRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const deleteCourseButtonStyle = {
  minWidth: 48,
  height: 28,
  borderRadius: 999,
  border: "1px solid #f1e4ee",
  background: "#fff",
  color: "#6b7280",
  cursor: "pointer",
  fontWeight: 700,
};

const routeGuideStyle = {
  margin: "10px 0 0 92px",
  padding: 12,
  border: "1px solid #dfe5ff",
  borderRadius: 14,
  background: "#fbfcff",
  fontSize: 13,
};

const routeLineStyle = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  gap: 8,
  lineHeight: 1.6,
  color: "#6b7280",
};

const nearbyWrapStyle = {
  marginTop: 12,
  padding: 12,
  border: "1px solid #f1e4ee",
  borderRadius: 14,
  background: "#fffafd",
};

const nearbyHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 10,
};

const nearbyCardStyle = {
  display: "flex",
  gap: 10,
  padding: 10,
  border: "1px solid #f0e4ea",
  borderRadius: 12,
  background: "#fff",
};

const nearbyPagerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginTop: 10,
  color: "#6b7280",
  fontSize: 13,
};

const pagerButtonStyle = {
  height: 30,
  borderRadius: 999,
  border: "1px solid #ffd3e1",
  background: "#fff7fb",
  color: "#ff5c8a",
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 10px",
};

const courseSearchBoxStyle = {
  padding: 12,
  border: "1px dashed #ffc3da",
  borderRadius: 12,
  background: "#fffafd",
};

const courseSearchRowStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const courseSearchHintStyle = {
  marginTop: 8,
  color: "#6b7280",
  fontSize: 13,
};

const courseSearchResultsStyle = {
  display: "grid",
  gap: 8,
  marginTop: 10,
};

const courseSearchResultCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 10,
  border: "1px solid #f1e4ee",
  borderRadius: 12,
  background: "#fff",
};

const courseSearchImageStyle = {
  width: 54,
  height: 54,
  borderRadius: 10,
  objectFit: "cover",
  background: "#f3f4f6",
  flexShrink: 0,
};

const inviteModalBackdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  background: "rgba(17, 24, 39, 0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const inviteModalStyle = {
  width: "min(520px, 100%)",
  maxHeight: "72vh",
  overflowY: "auto",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #ffd3e1",
  boxShadow: "0 24px 60px rgba(17, 24, 39, 0.22)",
  padding: 18,
};

const inviteModalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const inviteModalTitleStyle = {
  fontSize: 18,
  fontWeight: 900,
  color: "#111827",
};

const inviteModalSubStyle = {
  marginTop: 4,
  color: "#6b7280",
  fontSize: 13,
};

const inviteEventBoxStyle = {
  display: "grid",
  gap: 4,
  padding: 12,
  borderRadius: 12,
  background: "#fff7fb",
  border: "1px solid #ffe0ec",
  color: "#374151",
  marginBottom: 12,
};

const inviteListStyle = {
  display: "grid",
  gap: 10,
};

const inviteUserStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #f1e4ee",
  background: "#fff",
};

const inviteAvatarStyle = {
  width: 38,
  height: 38,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ffe4f1",
  color: "#ff538b",
  fontWeight: 900,
  flexShrink: 0,
};

const inviteEmptyStyle = {
  padding: 18,
  color: "#6b7280",
  textAlign: "center",
  fontSize: 14,
};

