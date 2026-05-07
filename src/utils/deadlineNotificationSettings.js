const DEADLINE_SETTINGS_PREFIX = "culture_wanderers_deadline_settings";

const DEFAULT_SETTINGS = {
  enabled: true,
  daysBefore: 7,
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getKey = (email) => `${DEADLINE_SETTINGS_PREFIX}:${normalizeEmail(email) || "guest"}`;

function safeParse(json) {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getDeadlineNotificationSettings(email) {
  const stored = safeParse(localStorage.getItem(getKey(email)));
  const daysBefore = Number(stored.daysBefore);

  return {
    enabled: stored.enabled !== false,
    daysBefore: [3, 7].includes(daysBefore) ? daysBefore : DEFAULT_SETTINGS.daysBefore,
  };
}

export function saveDeadlineNotificationSettings(email, settings) {
  const current = getDeadlineNotificationSettings(email);
  const next = {
    ...current,
    ...settings,
    daysBefore: [3, 7].includes(Number(settings?.daysBefore))
      ? Number(settings.daysBefore)
      : current.daysBefore,
  };

  localStorage.setItem(getKey(email), JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent("deadline-notification-settings-changed", {
      detail: { email: normalizeEmail(email), settings: next },
    })
  );
  return next;
}
