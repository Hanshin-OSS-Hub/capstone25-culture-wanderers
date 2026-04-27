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
  if (legacy.length === 0) return existing;

  localStorage.setItem(key, JSON.stringify(legacy));
  localStorage.removeItem(LEGACY_CALENDAR_STORAGE_KEY);
  return legacy;
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
      festivalId: event.festivalId || null,
      communityType: event.communityType || "",
      communityId: event.communityId || null,
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
