const CALENDAR_STORAGE_PREFIX = "mypage_calendar_events";
const LEGACY_CALENDAR_STORAGE_KEY = "mypage_calendar_events";

function safeParse(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getStoredUserEmail() {
  return (
    localStorage.getItem("loggedInUser") ||
    sessionStorage.getItem("loggedInUser") ||
    localStorage.getItem("email") ||
    sessionStorage.getItem("email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function getCalendarStorageKey(userEmail = getStoredUserEmail()) {
  const normalized = String(userEmail || "").trim().toLowerCase();
  return normalized
    ? `${CALENDAR_STORAGE_PREFIX}:${normalized}`
    : `${CALENDAR_STORAGE_PREFIX}:guest`;
}

function dispatchCalendarChange(userEmail = getStoredUserEmail()) {
  window.dispatchEvent(
    new CustomEvent("calendar-events-changed", {
      detail: { userEmail: String(userEmail || "").trim().toLowerCase() },
    })
  );
}

function migrateLegacyEventsIfNeeded(userEmail = getStoredUserEmail()) {
  const key = getCalendarStorageKey(userEmail);
  const existing = safeParse(localStorage.getItem(key), []);
  if (existing.length > 0) return existing;

  const legacy = safeParse(localStorage.getItem(LEGACY_CALENDAR_STORAGE_KEY), []);
  const guestKey = `${CALENDAR_STORAGE_PREFIX}:guest`;
  const guest = key === guestKey ? [] : safeParse(localStorage.getItem(guestKey), []);
  const candidates = [...legacy, ...guest];
  if (candidates.length === 0) return existing;

  const seen = new Set();
  const migrated = candidates.filter((event) => {
    const eventKey = [
      String(event?.id || ""),
      String(event?.date || ""),
      String(event?.title || ""),
      String(event?.festivalId || ""),
    ].join("|");
    if (seen.has(eventKey)) return false;
    seen.add(eventKey);
    return true;
  });

  localStorage.setItem(key, JSON.stringify(migrated));
  if (legacy.length > 0) {
    localStorage.removeItem(LEGACY_CALENDAR_STORAGE_KEY);
  }
  return migrated;
}

export function getCalendarEvents(userEmail = getStoredUserEmail()) {
  const migrated = migrateLegacyEventsIfNeeded(userEmail);
  if (migrated.length > 0) {
    return migrated;
  }

  return safeParse(localStorage.getItem(getCalendarStorageKey(userEmail)), []);
}

export function saveCalendarEvents(events, userEmail = getStoredUserEmail()) {
  localStorage.setItem(getCalendarStorageKey(userEmail), JSON.stringify(events));
  dispatchCalendarChange(userEmail);
}

export function addCalendarEvent(event, userEmail = getStoredUserEmail()) {
  const events = getCalendarEvents(userEmail);

  const exists = events.some(
    (item) => item.date === event.date && item.title === event.title
  );

  if (exists) return { added: false, events };

  const next = [
    {
      id: Date.now(),
      date: event.date,
      title: event.title,
      location: event.location || "",
      description: event.description || "",
      festivalPeriod: event.festivalPeriod || "",
      festivalStartDate: event.festivalStartDate || "",
      festivalEndDate: event.festivalEndDate || "",
      festivalId: event.festivalId || null,
      communityType: event.communityType || "",
      communityId: event.communityId || null,
      itineraryItems: Array.isArray(event.itineraryItems) ? event.itineraryItems : [],
      nearbyFestivals: Array.isArray(event.nearbyFestivals) ? event.nearbyFestivals : [],
      courseSource: event.courseSource || null,
      companions: Array.isArray(event.companions) ? event.companions : [],
      companionRequestId: event.companionRequestId || null,
      companionChatId: event.companionChatId || null,
      visitedCandidate: Boolean(event.visitedCandidate),
      verifiedVisit: Boolean(event.verifiedVisit),
      verificationMethod: event.verificationMethod || "",
      proofImageUrl: event.proofImageUrl || "",
    },
    ...events,
  ];

  saveCalendarEvents(next, userEmail);
  return { added: true, events: next };
}

export function removeCalendarEvent(id, userEmail = getStoredUserEmail()) {
  const next = getCalendarEvents(userEmail).filter((item) => item.id !== id);
  saveCalendarEvents(next, userEmail);
  return next;
}

export function updateCalendarEvent(id, updates, userEmail = getStoredUserEmail()) {
  const next = getCalendarEvents(userEmail).map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  saveCalendarEvents(next, userEmail);
  return next;
}
