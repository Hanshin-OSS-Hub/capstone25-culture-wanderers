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

  return `festival_likes:${String(email).toLowerCase()}`;
}

function readLikes() {
  return safeParse(localStorage.getItem(getCurrentUserKey()), []);
}

function writeLikes(next) {
  localStorage.setItem(getCurrentUserKey(), JSON.stringify(next));
  window.dispatchEvent(new Event("festival-likes-changed"));
  return next;
}

export function getLikedFestivals() {
  return readLikes();
}

export function isFestivalLiked(festivalId) {
  const id = String(festivalId);
  return getLikedFestivals().some((item) => String(item.id) === id);
}

export function addFestivalLike(festival) {
  const likes = getLikedFestivals();
  const id = String(festival.id);

  const exists = likes.some((item) => String(item.id) === id);
  if (exists) return likes;

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
      likedAt: new Date().toISOString(),
    },
    ...likes,
  ];

  return writeLikes(next);
}

export function removeFestivalLike(festivalId) {
  const id = String(festivalId);
  const next = getLikedFestivals().filter((item) => String(item.id) !== id);
  return writeLikes(next);
}

export function replaceLikedFestivals(items) {
  return writeLikes(Array.isArray(items) ? items : []);
}

export function clearLikedFestivals() {
  return writeLikes([]);
}
