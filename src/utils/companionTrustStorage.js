const TRUST_STORAGE_KEY = "culture_wanderers_companion_trust";

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
      : 3.8;
  const score = Math.round(Math.max(40, Math.min(99, 50 + average * 10 + Math.min(ratings.length, 10))));

  return {
    email: key,
    score,
    count: ratings.length,
    average,
    label:
      score >= 90
        ? "믿고 함께 가기 좋은 유목민"
        : score >= 80
        ? "함께 가기 좋은 유목민"
        : score >= 65
        ? "무난한 유목민"
        : "조금 더 확인이 필요한 유목민",
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
