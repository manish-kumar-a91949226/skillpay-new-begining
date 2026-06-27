// Optional Sentry hook — wired but inert unless SENTRY_DSN is set in .env
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = await import("@sentry/node");
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
    console.log("[sentry] monitoring enabled");
  } catch {
    console.warn("[sentry] SENTRY_DSN set but @sentry/node is not installed — run `npm install @sentry/node`");
  }
}

export function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.path}:`, err.message);

  if (Sentry) {
    Sentry.captureException(err);
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
