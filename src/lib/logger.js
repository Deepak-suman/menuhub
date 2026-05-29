import pino from "pino";

// Configure actual Pino with security redaction paths
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "password",
      "secret",
      "token",
      "cookie",
      "signature",
      "razorpayKeySecret",
      "razorpay_signature",
      "*.password",
      "*.secret",
      "*.token",
      "*.cookie",
      "*.signature",
      "*.razorpayKeySecret",
      "*.razorpay_signature",
      "authorization",
      "headers.authorization",
      "headers.cookie"
    ],
    censor: "[REDACTED]"
  }
});

/**
 * Diagnostic helper to track request timings and log outcomes.
 * @param {string} endpoint - The API endpoint name.
 * @param {string} method - HTTP method.
 * @param {Function} fn - The actual handler function.
 */
export async function withTiming(endpoint, method, fn) {
  const start = performance.now();
  try {
    const res = await fn();
    const duration = (performance.now() - start).toFixed(2);
    logger.info({ endpoint, method, duration: `${duration}ms`, status: res.status || 200 }, "API request timing diagnostic completed");
    return res;
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    logger.error({ endpoint, method, duration: `${duration}ms`, error: err.message || err }, "API request timing diagnostic failed");
    throw err;
  }
}
