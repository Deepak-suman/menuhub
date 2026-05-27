import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return NextResponse.json({ message: "If an account with that email exists, we have sent a reset link." }, { status: 200 });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
    
    // Simulate sending email by logging to console
    console.log("=========================================");
    console.log("PASSWORD RESET LINK GENERATED");
    console.log("To reset the password for", email, "click the link below:");
    console.log(resetLink);
    console.log("=========================================");

    return NextResponse.json({ message: "If an account with that email exists, we have sent a reset link." }, { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
