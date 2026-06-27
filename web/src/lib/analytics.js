"use client";

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // analytics silently disabled until a key is configured

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: true,
  });
  initialized = true;
}

/**
 * Required events per the submission checklist:
 * challenge_viewed, challenge_created, wallet_connected,
 * submission_made, reward_claimed
 */
export function track(event, properties = {}) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event, properties);
}
