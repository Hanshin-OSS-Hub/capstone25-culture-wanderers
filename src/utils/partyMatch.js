const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const unique = (items) => [...new Set(items.filter(Boolean))];

const getSelectedValues = (preference, key, topKey) => {
  const selected = Array.isArray(preference?.[key]) ? preference[key] : [];
  return unique([preference?.[topKey], ...selected].map(String));
};

const includesAny = (source, values) => {
  const normalizedSource = normalize(source);
  return values.some((value) => normalizedSource.includes(normalize(value)));
};

const getDaysUntil = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

export function buildPartyMatch(party, preference) {
  const regions = getSelectedValues(preference, "selectedRegions", "topRegion");
  const categories = getSelectedValues(preference, "selectedCategories", "topCategory");
  const partyText = [
    party?.title,
    party?.festival,
    party?.location,
    party?.region,
    party?.condition,
    party?.detail,
  ].join(" ");

  let score = 52;
  const reasons = [];

  if (regions.length > 0 && includesAny(partyText, regions)) {
    score += 18;
    reasons.push("관심 지역과 가까워요");
  }

  if (categories.length > 0 && includesAny(partyText, categories)) {
    score += 14;
    reasons.push("선호 장르와 맞아요");
  }

  const maxCount = Number(party?.maxCount ?? party?.maxPeople ?? 0);
  const currentCount = Number(party?.currentCount ?? party?.currentPeople ?? 0);
  const remaining = maxCount - currentCount;
  if (remaining > 0) {
    score += remaining === 1 ? 8 : 12;
    reasons.push(remaining === 1 ? "마지막 자리예요" : "참여 여유가 있어요");
  }

  const daysUntil = getDaysUntil(party?.meetingTime || party?.date);
  if (daysUntil != null && daysUntil >= 0 && daysUntil <= 14) {
    score += 8;
    reasons.push("2주 안에 만나는 일정이에요");
  }

  if (party?.isClosed) {
    score -= 35;
    reasons.push("모집이 마감되었어요");
  }

  const safeScore = Math.max(12, Math.min(98, Math.round(score)));
  const fallbackReasons = ["조건이 무난하게 맞아요", "축제 동행을 시작하기 좋아요"];

  return {
    score: safeScore,
    grade: safeScore >= 85 ? "매우 잘 맞음" : safeScore >= 70 ? "잘 맞음" : "보통",
    reasons: (reasons.length > 0 ? reasons : fallbackReasons).slice(0, 3),
  };
}
