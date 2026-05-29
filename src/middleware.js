import "@/lib/env";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Hardening NEXTAUTH_SECRET fallback forproduction  
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("CRITICAL SECURITY ERROR: NEXTAUTH_SECRET is not configured in production!");
}

export default withAuth(
  function proxy(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    // Route logic for VENDOR and SUPER_ADMIN
    if (path.startsWith("/admin")) {
      if (token?.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
      }
      if (token?.role !== "VENDOR") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    if (path.startsWith("/super-admin") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_super_secret_for_local_dev"
  }
);

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*"],
};