const rateLimitMap = new Map();

// Periodic prune interval to clean expired rate limit logs every 5 minutes
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.startTime > 300000) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000); // 5 minutes
}

/**
 * Smart Hybrid Rate Limiter
 * - If Vercel KV REST API is configured (production), uses global Redis rate limiting.
 * - Otherwise (local development/VPS), falls back to a memory-cached map gracefully.
 * @param {string} key 
 * @param {number} limit 
 * @param {number} windowMs 
 * @returns {Promise<boolean>|boolean}
 */
export async function rateLimit(key, limit = 5, windowMs = 60000) {
  const now = Date.now();

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  // 1. High Performance Vercel KV (Redis) REST Implementation for Serverless Edge
  if (kvUrl && kvToken) {
    try {
      const cleanUrl = kvUrl.endsWith("/") ? kvUrl : `${kvUrl}/`;
      
      // Execute an atomic multi-pipeline command via standard REST call
      const pipelineRes = await fetch(`${cleanUrl}pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kvToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          ["INCR", key],
          ["PTTL", key]
        ])
      });

      if (pipelineRes.ok) {
        const results = await pipelineRes.json();
        const count = results[0]?.result || 1;
        const pttl = results[1]?.result || -1;

        // If it's a fresh key, set the key expiration TTL window
        if (count === 1 || pttl < 0) {
          await fetch(`${cleanUrl}pexpire/${key}/${windowMs}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${kvToken}` }
          });
        }

        if (count > limit) {
          return false; // Limit exceeded
        }
        return true;
      }
    } catch (e) {
      console.warn("Vercel KV connection failed, falling back to memory:", e.message);
    }
  }

  // 2. Fallback In-Memory Rate Limiting (Local Dev & VPS Standalone)
  const windowStart = now - windowMs;
  let requestData = rateLimitMap.get(key);

  if (!requestData) {
    requestData = { count: 1, startTime: now };
    rateLimitMap.set(key, requestData);
    return true;
  }

  if (requestData.startTime < windowStart) {
    requestData.count = 1;
    requestData.startTime = now;
    rateLimitMap.set(key, requestData);
    return true;
  }

  if (requestData.count >= limit) {
    return false; // Limit exceeded
  }

  requestData.count++;
  rateLimitMap.set(key, requestData);
  return true;
}
