const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("skillpay_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("skillpay_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("skillpay_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),

  getChallenges: (params = "") => request(`/challenges${params}`),
  getChallenge: (id) => request(`/challenges/${id}`),
  createChallenge: (payload) => request("/challenges", { method: "POST", body: payload }),
  fundChallenge: (id, payload) => request(`/challenges/${id}/fund`, { method: "POST", body: payload || undefined }),

  submitProject: (payload) => request("/submissions", { method: "POST", body: payload }),
  mySubmissions: () => request("/submissions/mine"),
  challengeSubmissions: (challengeId) => request(`/submissions/challenge/${challengeId}`),
  approveSubmission: (id) => request(`/submissions/${id}/approve`, { method: "PATCH" }),
  rejectSubmission: (id) => request(`/submissions/${id}/reject`, { method: "PATCH" }),

  myProfile: () => request("/profile/me"),
  getBalance: () => request("/profile/balance"),
  publicProfile: (id) => request(`/profile/${id}`, { auth: false }),
  recentRewardsFeed: () => request("/profile/feed/recent", { auth: false }),
  submitFeedback: (payload) => request("/feedback", { method: "POST", body: payload }),
};
