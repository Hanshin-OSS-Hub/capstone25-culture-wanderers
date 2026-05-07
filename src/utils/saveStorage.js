function safeParse(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getCurrentUserKey() {
  const email =
    localStorage.getItem("loggedInUser") ||
    sessionStorage.getItem("loggedInUser") ||
    localStorage.getItem("email") ||
    sessionStorage.getItem("email") ||
    "guest";

  return `festival_saves:${String(email).toLowerCase()}`;
}

function readSaves() {
  return safeParse(localStorage.getItem(getCurrentUserKey()), []);
}

function writeSaves(next) {
  localStorage.setItem(getCurrentUserKey(), JSON.stringify(next));
  window.dispatchEvent(new Event("festival-saves-changed"));
  return next;
}

export function getSavedFestivals() {
  return readSaves();
}

export function isFestivalSaved(festivalId) {
  const id = String(festivalId);
  return getSavedFestivals().some((item) => String(item.id) === id);
}

export function addFestivalSave(festival) {
  const saves = getSavedFestivals();
  const id = String(festival.id);

  const exists = saves.some((item) => String(item.id) === id);
  if (exists) return saves;

  const next = [
    {
      id: festival.id,
      title: festival.title || "",
      region: festival.region || "",
      location: festival.location || "",
      thumbnail_url: festival.thumbnail_url || festival.thumbnailUrl || "",
      start_date: festival.start_date || festival.startDate || "",
      end_date: festival.end_date || festival.endDate || "",
      category: festival.category || "",
      savedAt: new Date().toISOString(),
    },
    ...saves,
  ];

  return writeSaves(next);
}

export function removeFestivalSave(festivalId) {
  const id = String(festivalId);
  const next = getSavedFestivals().filter((item) => String(item.id) !== id);
  return writeSaves(next);
}

export function replaceSavedFestivals(items) {
  return writeSaves(Array.isArray(items) ? items : []);
}

export function clearSavedFestivals() {
  return writeSaves([]);
}
