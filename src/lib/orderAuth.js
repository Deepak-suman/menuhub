import crypto from "crypto";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production!");
}

const JWT_SECRET = process.env.JWT_SECRET || "menuhub_default_fallback_secret_key_123456";

/**
 * Signs an order ID using HMAC-SHA256 and embeds a timestamp for secure 12-hour expiration.
 * Format: `orderId:timestamp.signature`
 * @param {string} orderId 
 * @returns {string} secure orderToken
 */
export function signOrder(orderId) {
  if (!orderId) return "";
  
  const timestamp = Date.now();
  const payload = `${orderId}:${timestamp}`;
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payload)
    .digest("hex");
    
  return `${payload}.${signature}`;
}

/**
 * Verifies a token against a target order ID.
 * Supports secure 12-hour expiration and backward-compatibility for legacy tokens (no timestamp).
 * @param {string} token 
 * @param {string} targetOrderId 
 * @returns {boolean}
 */
export function verifyOrder(token, targetOrderId) {
  if (!token || !targetOrderId) return false;
  
  // Extract token from bearer header if needed
  let cleanToken = token;
  if (token.startsWith("Bearer ")) {
    cleanToken = token.substring(7);
  }
  
  const parts = cleanToken.split(".");
  if (parts.length !== 2) return false;
  
  const [payload, signature] = parts;
  
  // Handle new format with timestamp (orderId:timestamp)
  let orderId = payload;
  let timestamp = null;
  
  if (payload.includes(":")) {
    const subParts = payload.split(":");
    orderId = subParts[0];
    timestamp = parseInt(subParts[1]);
  }
  
  if (orderId !== targetOrderId) return false;
  
  // Enforce a strict 12-hour expiration threshold for new timestamped tokens
  if (timestamp) {
    const now = Date.now();
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    if (now - timestamp > twelveHoursMs) {
      console.warn(`Order Token Expired. Order ID: ${targetOrderId}`);
      return false; // Token has expired
    }
  }
  
  // Re-generate signature to timing-safely compare
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payload)
    .digest("hex");
    
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (e) {
    return false;
  }
}
