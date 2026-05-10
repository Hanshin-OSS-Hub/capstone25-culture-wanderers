const TRUST_STORAGE_KEY = "culture_wanderers_companion_trust";

export const COMPANION_TEMPERATURE_GUIDE = [
  { range: "90℃ 이상", label: "매우 든든해요", description: "좋은 동행 평가가 여러 번 쌓인 상태예요." },
  { range: "80 ~ 89℃", label: "함께 가기 좋아요", description: "긍정적인 동행 평가가 안정적으로 있어요." },
  { range: "65 ~ 79℃", label: "믿을만해요", description: "기본 신뢰가 있고 평가가 더 쌓이면 좋아요." },
  { range: "50 ~ 64℃", label: "기본 신뢰", description: "동행을 시작해볼 수 있지만 후기를 확인해보세요." },
  { range: "40 ~ 49℃", label: "평가 부족", description: "아직 판단할 만큼 동행 평가가 많지 않아요." },
  { range: "39℃ 이하", label: "확인 필요", description: "동행 전 대화와 약속 확인을 더 꼼꼼히 해주세요." },
];

function safeParse(json, fallback = {}) {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function dispatchTrustChange(targetEmail) {
  window.dispatchEvent(
    new CustomEvent("companion-trust-changed", {
      detail: { targetEmail: normalizeEmail(targetEmail) },
    })
  );
}

function getTemperatureLabel(score, count) {
  if (count <= 0) return "아직 동행 평가가 부족해요";
  if (score >= 90) return "매우 든든해요";
  if (score >= 80) return "함께 가기 좋아요";
  if (score >= 65) return "믿을만해요";
  if (score >= 50) return "기본 신뢰";
  if (score >= 40) return "평가 부족";
  return "확인 필요";
}

export function getAllCompanionTrust() {
  return safeParse(localStorage.getItem(TRUST_STORAGE_KEY), {});
}

export function getCompanionTrust(email) {
  const key = normalizeEmail(email);
  const all = getAllCompanionTrust();
  const entry = all[key] || { ratings: [] };
  const ratings = Array.isArray(entry.ratings) ? entry.ratings : [];
  const average =
    ratings.length > 0
      ? ratings.reduce((sum, item) => sum + Number(item.score || 0), 0) / ratings.length
      : 0;
  const score =
    ratings.length > 0
      ? Math.round(Math.max(30, Math.min(95, 40 + average * 7 + Math.min(ratings.length * 3, 15))))
      : 45;
  const label = getTemperatureLabel(score, ratings.length);

  return {
    email: key,
    score,
    count: ratings.length,
    average,
    ratings,
    label,
  };
}

export function hasRatedCompanion({ partyId, fromEmail, targetEmail }) {
  const trust = getAllCompanionTrust()[normalizeEmail(targetEmail)];
  const ratings = Array.isArray(trust?.ratings) ? trust.ratings : [];
  return ratings.some(
    (item) =>
      String(item.partyId) === String(partyId) &&
      normalizeEmail(item.fromEmail) === normalizeEmail(fromEmail)
  );
}

export function addCompanionRating({ partyId, fromEmail, targetEmail, targetName, score, memo = "" }) {
  const normalizedTarget = normalizeEmail(targetEmail);
  const normalizedFrom = normalizeEmail(fromEmail);
  if (!normalizedTarget || !normalizedFrom) return null;

  const all = getAllCompanionTrust();
  const current = all[normalizedTarget] || { ratings: [] };
  const ratings = Array.isArray(current.ratings) ? current.ratings : [];
  const nextRating = {
    id: Date.now(),
    partyId,
    fromEmail: normalizedFrom,
    targetEmail: normalizedTarget,
    targetName: targetName || normalizedTarget,
    score: Math.max(1, Math.min(5, Number(score) || 3)),
    memo,
    createdAt: new Date().toISOString(),
  };

  const next = {
    ...all,
    [normalizedTarget]: {
      ratings: [
        nextRating,
        ...ratings.filter(
          (item) =>
            !(
              String(item.partyId) === String(partyId) &&
              normalizeEmail(item.fromEmail) === normalizedFrom
            )
        ),
      ],
    },
  };

  localStorage.setItem(TRUST_STORAGE_KEY, JSON.stringify(next));
  dispatchTrustChange(normalizedTarget);
  return getCompanionTrust(normalizedTarget);
}
