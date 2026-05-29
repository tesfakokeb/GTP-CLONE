/** Origins allowed to call this API (browser Origin has no trailing slash). */
function normalizeOrigin(origin) {
  return origin?.trim().replace(/\/$/, "") ?? origin;
}

const DEFAULT_ORIGINS = [
  "https://gtp-clone-pi.vercel.app",
  "https://gtp-clone-bk.vercel.app",
  "http://localhost:2000",
  "http://localhost:5173",
  "http://127.0.0.1:2000",
  "http://127.0.0.1:5173",
];

const ALLOWED_ORIGINS = new Set(
  [
    ...DEFAULT_ORIGINS,
    ...(process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()),
  ]
    .filter(Boolean)
    .map(normalizeOrigin),
);

function isLocalhostOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
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
