import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  NEXTAUTH_SECRET: z.string().min(8, "NEXTAUTH_SECRET must be at least 8 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
});

// Validate environment variables
const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
});

if (!parsed.success) {
  console.error("❌ CRITICAL ENVIRONMENT VALIDATION ERROR:");
  parsed.error.errors.forEach((err) => {
    console.error(`   - ${err.path.join(".")}: ${err.message}`);
  });
  throw new Error("Application startup blocked due to invalid environment variables.");
}

export const env = parsed.data;
