const NOTIFICATION_STORAGE_PREFIX = "culture_wanderers_notifications";

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

function getNotificationKey(userEmail = getStoredUserEmail()) {
  const normalized = String(userEmail || "").trim().toLowerCase();
  return normalized
    ? `${NOTIFICATION_STORAGE_PREFIX}:${normalized}`
    : `${NOTIFICATION_STORAGE_PREFIX}:guest`;
}

function safeParse(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function dispatchNotificationChange(userEmail = getStoredUserEmail()) {
  window.dispatchEvent(
    new CustomEvent("notifications-changed", {
      detail: { userEmail: String(userEmail || "").trim().toLowerCase() },
    })
  );
}

export function getNotifications(userEmail = getStoredUserEmail()) {
  const key = getNotificationKey(userEmail);
  const notifications = safeParse(localStorage.getItem(key), []);
  return notifications
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export function saveNotifications(notifications, userEmail = getStoredUserEmail()) {
  const key = getNotificationKey(userEmail);
  localStorage.setItem(key, JSON.stringify(notifications));
  dispatchNotificationChange(userEmail);
}

export function addNotification(userEmail, notification) {
  const normalized = String(userEmail || "").trim().toLowerCase();
  if (!normalized) return null;

  const current = getNotifications(normalized);
  const nextItem = {
    id: notification.id || Date.now(),
    type: notification.type || "general",
    title: notification.title || "새 알림",
    message: notification.message || "",
    createdAt: notification.createdAt || new Date().toISOString(),
    read: false,
    calendarAdded: Boolean(notification.calendarAdded),
    ...notification,
  };

  saveNotifications([nextItem, ...current], normalized);
  return nextItem;
}

export function markNotificationRead(notificationId, userEmail = getStoredUserEmail()) {
  const current = getNotifications(userEmail);
  const next = current.map((item) =>
    String(item.id) === String(notificationId) ? { ...item, read: true } : item
  );
  saveNotifications(next, userEmail);
  return next;
}

export function updateNotification(notificationId, patch, userEmail = getStoredUserEmail()) {
  const current = getNotifications(userEmail);
  const next = current.map((item) =>
    String(item.id) === String(notificationId) ? { ...item, ...patch } : item
  );
  saveNotifications(next, userEmail);
  return next;
}

export function getUnreadNotificationCount(userEmail = getStoredUserEmail()) {
  return getNotifications(userEmail).filter((item) => !item.read).length;
}

export function getCurrentNotificationUserEmail() {
  return getStoredUserEmail();
}

export function getDisplayName({ email = "", nickname = "" } = {}) {
  const name = String(nickname || "").trim();
  if (name) return name;

  const safeEmail = String(email || "").trim();
  if (!safeEmail) return "누군가";
  return safeEmail.includes("@") ? safeEmail.split("@")[0] : safeEmail;
}
