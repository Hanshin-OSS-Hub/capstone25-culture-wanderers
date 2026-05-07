const API_BASE = "http://localhost:8080";

function getStoredValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function getStoredToken() {
  return getStoredValue("token") || "";
}

export async function authFetch(url, options = {}) {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `요청 실패: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}