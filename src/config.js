const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  port: toInt(process.env.PORT, 3000),
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 120),
  corsOrigin: process.env.CORS_ORIGIN ?? '*'
};
