const CALENDAR_STORAGE_KEY = 'mypage_calendar_events';

function safeParse(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getCalendarEvents() {
  return safeParse(localStorage.getItem(CALENDAR_STORAGE_KEY), []);
}

export function saveCalendarEvents(events) {
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event('calendar-events-changed'));
}

export function addCalendarEvent(event) {
  const events = getCalendarEvents();

  const exists = events.some(
    (item) =>
      item.date === event.date &&
      item.title === event.title
  );

  if (exists) return { added: false, events };

  const next = [
    {
      id: Date.now(),
      date: event.date,
      title: event.title,
      location: event.location || '',
      description: event.description || '',
      festivalPeriod: event.festivalPeriod || '',
    },
    ...events,
  ];

  saveCalendarEvents(next);
  return { added: true, events: next };
}

export function removeCalendarEvent(id) {
  const next = getCalendarEvents().filter((item) => item.id !== id);
  saveCalendarEvents(next);
  return next;
}