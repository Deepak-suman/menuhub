import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTiming } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req) {
  return withTiming("/api/health", "GET", async () => {
    try {
      // Perform database ping diagnostic
      await prisma.$executeRaw`SELECT 1`;

      return NextResponse.json({
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } catch (err) {
      return NextResponse.json({
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        error: "Database check failed"
      }, { status: 500 });
    }
  });
}
