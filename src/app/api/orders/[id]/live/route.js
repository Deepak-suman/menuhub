import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderEvents } from "@/lib/orderEvents";
import { getAuthorizedUser } from "@/lib/authorize";
import { verifyOrder } from "@/lib/orderAuth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // Verify that the order exists first
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        items: { include: { menuItem: true } },
        restaurant: { select: { name: true, logo: true } }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Extract token
    let token = req.headers.get("authorization");
    if (!token) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("token");
    }

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    const isClientAuthorized = token && verifyOrder(token, id);

    if (!auth && !isClientAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If VENDOR, check if restaurant matches
    if (auth && auth.role !== "SUPER_ADMIN" && order.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If order is already closed, no need for SSE stream, client doesn't need to listen
    if (order.status === "CLOSED") {
      return NextResponse.json({ message: "Order is already closed" }, { status: 200 });
    }

    // Create stream
    const responseStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Helper to enqueue a formatted event stream chunk
        const sendEvent = (event, data) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch (err) {
            console.error("SSE sendEvent error:", err);
            cleanup();
          }
        };

        // Send initial order state so client has latest data immediately on connection
        sendEvent("initial", order);

        // Listener for real-time order updates
        const onOrderUpdate = (updatedOrder) => {
          sendEvent("update", updatedOrder);

          // If the order gets closed, clean up and close the stream
          if (updatedOrder.status === "CLOSED") {
            cleanup();
          }
        };

        const eventName = `update-${id}`;
        orderEvents.on(eventName, onOrderUpdate);

        // Keep-alive heartbeat to prevent serverless/proxy timeouts (every 10 seconds)
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch (err) {
            cleanup();
          }
        }, 10000);

        let isCleanedUp = false;
        const cleanup = () => {
          if (isCleanedUp) return;
          isCleanedUp = true;

          clearInterval(heartbeatInterval);
          orderEvents.off(eventName, onOrderUpdate);
          try {
            controller.close();
          } catch (err) {
            // ignore stream already closed errors
          }
        };

        // Listen for client connection abort
        req.signal.addEventListener("abort", () => {
          cleanup();
        });
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE stream startup error:", error);
    return NextResponse.json({ error: "Failed to establish live connection" }, { status: 500 });
  }
}
