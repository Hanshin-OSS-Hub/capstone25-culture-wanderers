import { authFetch } from "./authFetch";

export async function saveActivity(activity) {
  try {
    await authFetch("/api/activity", {
      method: "POST",
      body: JSON.stringify({
        userId: 1,
        ...activity,
      }),
    });
  } catch (error) {
    console.error("활동 로그 저장 실패:", error);
  }
}
