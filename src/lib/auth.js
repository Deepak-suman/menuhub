import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET_VALUE = process.env.JWT_SECRET;

if (!JWT_SECRET_VALUE && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is not defined in production environment.");
}

const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_VALUE || "default_super_secret_fallback_for_local_development"
);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}
