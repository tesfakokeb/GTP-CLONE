/** Origins allowed to call this API (browser sends exact Origin, no trailing slash). */
const ALLOWED_ORIGINS = new Set([
  "https://gtp-clone-pi.vercel.app/",
  "http://localhost:2000",
  "http://localhost:5173",
  "http://127.0.0.1:2000",
  "http://127.0.0.1:5173",
]);

function isLocalhostOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function normalizeOrigin(origin) {
  return origin?.replace(/\/$/, "") ?? origin;
}

export function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  return ALLOWED_ORIGINS.has(normalized) || isLocalhostOrigin(normalized);
}

export const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
