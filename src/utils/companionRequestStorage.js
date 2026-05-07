const CHAT_PREFIX = "culture_wanderers_companion_chat";

export const WEEKDAY_OPTIONS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

const WEEKDAY_INDEX = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function safeParse(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getChatKey(chatId) {
  return `${CHAT_PREFIX}:${String(chatId || "").trim()}`;
}

function dispatchChatChange(chatId) {
  window.dispatchEvent(new CustomEvent("companion-chat-changed", { detail: { chatId } }));
}

export function createCompanionRequestId() {
  return `companion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getCompanionChatMessages(chatId) {
  if (!chatId) return [];
  return safeParse(localStorage.getItem(getChatKey(chatId)), []);
}

export function addCompanionChatMessage(chatId, message) {
  if (!chatId) return [];

  const current = getCompanionChatMessages(chatId);
  const next = [
    ...current,
    {
      id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderEmail: message.senderEmail || "",
      senderName: message.senderName || "사용자",
      text: message.text || "",
      createdAt: message.createdAt || new Date().toISOString(),
    },
  ];

  localStorage.setItem(getChatKey(chatId), JSON.stringify(next));
  dispatchChatChange(chatId);
  return next;
}

export function getWeekdayLabels(keys = []) {
  const selected = new Set(Array.isArray(keys) ? keys : []);
  return WEEKDAY_OPTIONS.filter((item) => selected.has(item.key)).map((item) => item.label);
}

export function getNextDateForWeekday(weekdayKey) {
  const target = WEEKDAY_INDEX[weekdayKey] ?? new Date().getDay();
  const date = new Date();
  const diff = (target - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
