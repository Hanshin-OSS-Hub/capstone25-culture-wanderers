const LIKE_STORAGE_KEY = "festival_likes";

function safeParse(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getLikedFestivals() {
  return safeParse(localStorage.getItem(LIKE_STORAGE_KEY), []);
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
      thumbnail_url: festival.thumbnail_url || "",
      start_date: festival.start_date || "",
      end_date: festival.end_date || "",
      category: festival.category || "",
      likedAt: new Date().toISOString(),
    },
    ...likes,
  ];

  localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("festival-likes-changed"));
  return next;
}

export function removeFestivalLike(festivalId) {
  const id = String(festivalId);
  const next = getLikedFestivals().filter((item) => String(item.id) !== id);

  localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("festival-likes-changed"));
  return next;
}

export function toggleFestivalLike(festival) {
  if (isFestivalLiked(festival.id)) {
    removeFestivalLike(festival.id);
    return false;
  }

  addFestivalLike(festival);
  return true;
}