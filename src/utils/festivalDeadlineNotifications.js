import { getCalendarEvents } from "./calendarStorage";
import { getSavedFestivals } from "./saveStorage";
import { addNotification, findNotification } from "./notificationStorage";
import { getDeadlineNotificationSettings } from "./deadlineNotificationSettings";

const DEFAULT_DEADLINE_WINDOW_DAYS = 7;

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  if (raw.includes("T")) return raw.split("T")[0];
  return raw.slice(0, 10);
}

function toLocalDate(value) {
  const normalized = normalizeDate(value);
  if (!normalized) return null;

  const date = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDaysUntil(endDate) {
  const today = getStartOfToday();
  const end = toLocalDate(endDate);
  if (!end) return null;

  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function hasCalendarPlanForFestival(festival, userEmail) {
  const festivalId = String(festival.id || "");
  if (!festivalId) return false;

  return getCalendarEvents(userEmail).some((event) => String(event.festivalId || "") === festivalId);
}

export function getDeadlineNotificationKey(festival) {
  const endDate = normalizeDate(festival.end_date || festival.endDate);
  return `festival-ending-soon:${festival.id}:${endDate}`;
}

export function getPlanDateBeforeDeadline(endDateValue) {
  const today = getStartOfToday();
  const end = toLocalDate(endDateValue);
  if (!end) return formatDate(today);

  for (let offset = 0; offset <= 6; offset += 1) {
    const candidate = addDays(today, offset);
    const day = candidate.getDay();
    if ((day === 0 || day === 6) && candidate <= end) {
      return formatDate(candidate);
    }
  }

  return formatDate(end >= today ? end : today);
}

export function buildDeadlineCalendarEvent(festival, plannedDate) {
  const title = festival.title || "저장한 축제";
  const location = festival.location || [festival.region, festival.location].filter(Boolean).join(" ").trim();
  const startDate = normalizeDate(festival.start_date || festival.startDate);
  const endDate = normalizeDate(festival.end_date || festival.endDate);

  return {
    date: plannedDate || getPlanDateBeforeDeadline(endDate),
    title,
    location,
    description: "종료 임박 알림에서 추가한 갈 예정 일정",
    festivalPeriod: [startDate, endDate].filter(Boolean).join(" ~ "),
    festivalId: festival.id,
  };
}

export function notifySavedFestivalDeadlines(userEmail) {
  const normalizedUser = String(userEmail || "").trim().toLowerCase();
  if (!normalizedUser) return [];

  const settings = getDeadlineNotificationSettings(normalizedUser);
  if (!settings.enabled) return [];

  const deadlineWindowDays = settings.daysBefore || DEFAULT_DEADLINE_WINDOW_DAYS;
  const savedFestivals = getSavedFestivals();
  const created = [];

  savedFestivals.forEach((festival) => {
    if (hasCalendarPlanForFestival(festival, normalizedUser)) return;

    const endDate = normalizeDate(festival.end_date || festival.endDate);
    const daysLeft = getDaysUntil(endDate);
    if (daysLeft === null || daysLeft < 0 || daysLeft > deadlineWindowDays) return;

    const notificationKey = getDeadlineNotificationKey(festival);
    const exists = findNotification(
      normalizedUser,
      (notification) =>
        notification.type === "festival-ending-soon" &&
        notification.notificationKey === notificationKey
    );

    if (exists) return;

    const plannedDate = getPlanDateBeforeDeadline(endDate);
    const title = festival.title || "저장한 축제";
    const message =
      daysLeft === 0
        ? `${title}이 오늘 종료돼요. 일정표에 추가할까요?`
        : `${title}이 ${daysLeft}일 뒤 종료돼요. 일정표에 추가할까요?`;

    const notification = addNotification(normalizedUser, {
      type: "festival-ending-soon",
      notificationKey,
      title: "저장한 축제 종료 임박",
      message,
      actionLabel: "일정표에 추가",
      festival,
      plannedDate,
      path: "/mypage/calendar",
    });

    if (notification) created.push(notification);
  });

  return created;
}
