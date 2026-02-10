export const createRateLimiter = ({ maxRequests, windowMs }) => {
  const entries = new Map();

  return (clientId) => {
    const now = Date.now();
    const current = entries.get(clientId);

    if (!current || now >= current.resetAt) {
      entries.set(clientId, {
        count: 1,
        resetAt: now + windowMs
      });
      return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
    }

    current.count += 1;
    const remaining = Math.max(0, maxRequests - current.count);

    return {
      allowed: current.count <= maxRequests,
      remaining,
      resetInMs: Math.max(0, current.resetAt - now)
    };
  };
};
