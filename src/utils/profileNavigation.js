export function canOpenUserProfile(email, isAnonymous = false) {
  const normalizedEmail = String(email || "").trim();
  if (!normalizedEmail) return false;
  if (isAnonymous) return false;
  return normalizedEmail.toLowerCase() !== "익명";
}

export function openUserProfile(navigate, email) {
  const normalizedEmail = String(email || "").trim();
  if (!normalizedEmail) return;
  navigate(`/profile/${encodeURIComponent(normalizedEmail)}`);
}
