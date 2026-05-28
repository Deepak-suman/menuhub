import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const PREFIX = 'enc:';

// Get the encryption key and ensure it is 32 bytes
function getSecretKey() {
  if (process.env.NODE_ENV === "production" && !process.env.ENCRYPTION_KEY) {
    throw new Error("CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is missing in production!");
  }
  const rawKey = process.env.ENCRYPTION_KEY || 'menuhub_super_secret_encrypt_key32';
  // Pad or truncate to ensure exactly 32 bytes
  if (rawKey.length === 32) return rawKey;
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text 
 * @returns {string} Encrypted format: enc:iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encrypt(text) {
  if (!text) return text;
  
  try {
    const key = getSecretKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

/**
 * Decrypt text encrypted via the encrypt function.
 * If input is plain text or legacy data, returns the input as-is.
 * @param {string} encryptedText 
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  // If it doesn't have our signature prefix, it is legacy plain text
  if (!encryptedText.startsWith(PREFIX)) {
    return encryptedText;
  }
  
  try {
    const key = getSecretKey();
    const parts = encryptedText.substring(PREFIX.length).split(':');
    if (parts.length !== 3) {
      // Malformed format, return as-is (legacy)
      return encryptedText;
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.warn('Decryption failed, assuming plain text:', error.message);
    return encryptedText;
  }
}
