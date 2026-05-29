import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { orderEvents } from '@/lib/orderEvents';
import { rateLimit } from '@/lib/rate-limit';
import { getAuthorizedUser } from "@/lib/authorize";
import { verifyOrder } from "@/lib/orderAuth";
import { logger, withTiming } from "@/lib/logger";
import "@/lib/env"; // Ensure env vars are validated

export async function POST(req) {
  return withTiming("/api/payment/verify", "POST", async () => {
    try {
      // --- ANTI-BRUTE FORCE / RATE LIMITING ---
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
      const allowed = await rateLimit(`pay-verify-${ip}`, 5, 60000); // Limit: 5 verify attempts/min per IP
      if (!allowed) {
        logger.warn({ ip }, "Security: Rate limit exceeded for payment verification");
        return NextResponse.json(
          { success: false, error: "Too many verification attempts. Please wait a minute." },
          { status: 429 }
        );
      }

      const body = await req.json();
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId, // our DB order ID
      } = body;

      // --- IDOR PROTECTION ---
      let token = req.headers.get("authorization");
      if (!token) {
        const { searchParams } = new URL(req.url);
        token = searchParams.get("token");
      }

      const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
      const isClientAuthorized = token && verifyOrder(token, orderId);

      if (!auth && !isClientAuthorized) {
        logger.warn({ orderId, ip }, "Security: Unauthorized access attempt to payment verification");
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      // Fetch order with restaurant for smart secret selection
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: {
            select: {
              plan: true,
              razorpayKeySecret: true,
            }
          }
        }
      });

      if (!dbOrder) {
        logger.error({ orderId }, "Order not found during payment verification");
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      // --- SANDBOX/MOCK PAYMENT VERIFICATION BYPASS ---
      if (razorpay_payment_id && razorpay_payment_id.startsWith("pay_mock_")) {
        if (process.env.NODE_ENV === "production") {
          logger.warn({ orderId, razorpay_payment_id, ip }, "Security Attack: Blocked sandbox mock payment bypass attempt in production environment");
          return NextResponse.json({ success: false, error: "Mock payments are disabled in production mode." }, { status: 400 });
        }

        logger.info({ orderId, razorpay_payment_id }, "Sandbox mock payment verified successfully");
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: true,
            paymentMode: "ONLINE",
            razorpayPaymentId: razorpay_payment_id,
          }
        });

        // Emit event for real-time customer tracking SSE stream
        orderEvents.emit(`update-${orderId}`, updatedOrder);

        return NextResponse.json({ success: true, message: "Sandbox mock payment verified successfully", isSandboxMock: true });
      }

      // --- SMART SECRET SELECTION ---
      let secret;
      if (dbOrder.restaurant.plan === "PAID" && dbOrder.restaurant.razorpayKeySecret) {
        secret = decrypt(dbOrder.restaurant.razorpayKeySecret);
      } else {
        secret = process.env.RAZOR_SECRET_KEY;
      }

      if (!secret) {
        logger.error({ orderId }, "Razorpay secret key configuration is missing");
        return NextResponse.json({ success: false, error: "Payment configuration error" }, { status: 500 });
      }

      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
        logger.info({ orderId, razorpay_payment_id }, "Payment signature verified successfully");
        // Payment is legit
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: true,
            paymentMode: "ONLINE",
            razorpayPaymentId: razorpay_payment_id,
          }
        });

        // Emit event for real-time customer tracking SSE stream
        orderEvents.emit(`update-${orderId}`, updatedOrder);

        return NextResponse.json({ success: true, message: "Payment verified successfully" });
      } else {
        logger.warn({ orderId, razorpay_payment_id, ip }, "Security: Invalid payment signature verification attempt");
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
      }
    } catch (error) {
      logger.error({ error: error.message || error, stack: error.stack }, "Razorpay payment verify error");
      return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
  });
}
