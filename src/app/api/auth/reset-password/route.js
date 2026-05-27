import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    // Find user with this token and ensure token is not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // token expiry must be greater than current time
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
