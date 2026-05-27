import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { orderEvents } from '@/lib/orderEvents';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Get the raw request body string for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature header missing' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    
    // Extract the Razorpay Order ID from either event type
    let razorpayOrderId = null;
    let razorpayPaymentId = null;

    if (payload.event === 'order.paid' && payload.payload?.order?.entity) {
      razorpayOrderId = payload.payload.order.entity.id;
    } else if (payload.event === 'payment.captured' && payload.payload?.payment?.entity) {
      razorpayOrderId = payload.payload.payment.entity.order_id;
      razorpayPaymentId = payload.payload.payment.entity.id;
    }

    if (!razorpayOrderId) {
      // Not a payment/order completion webhook, return success but don't process
      return NextResponse.json({ received: true, message: 'Unhandled event type' });
    }

    // Find the order that matches this Razorpay Order ID
    const dbOrder = await prisma.order.findFirst({
      where: { razorpayOrderId },
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
      return NextResponse.json({ error: 'Matching order not found' }, { status: 404 });
    }

    // --- SMART SECRET SELECTION FOR WEBHOOK ---
    // If the vendor is on PAID plan and has their own secret, use it. Otherwise use the platform webhook secret.
    let webhookSecret;
    if (dbOrder.restaurant.plan === 'PAID' && dbOrder.restaurant.razorpayKeySecret) {
      webhookSecret = decrypt(dbOrder.restaurant.razorpayKeySecret);
    } else {
      // Use the specific webhook secret configured in the environment, falling back to API secret if not set
      webhookSecret = process.env.RAZOR_WEBHOOK_SECRET || process.env.RAZOR_SECRET_KEY;
    }

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
    }

    // Verify the webhook signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn(`Webhook Signature Mismatch. Order ID: ${dbOrder.id}`);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // If verified, mark the order as paid asynchronously
    if (!dbOrder.isPaid) {
      const updatedOrder = await prisma.order.update({
        where: { id: dbOrder.id },
        data: {
          isPaid: true,
          paymentMode: 'ONLINE',
          razorpayPaymentId: razorpayPaymentId || dbOrder.razorpayPaymentId,
        }
      });
      console.log(`[Webhook Success] Order #${dbOrder.id} marked as paid.`);
      
      // Emit event for real-time customer tracking SSE stream
      orderEvents.emit(`update-${dbOrder.id}`, updatedOrder);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
