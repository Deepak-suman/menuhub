import { NextResponse } from "next/server";
import { orderEvents } from "@/lib/orderEvents";
import { getAuthorizedUser } from "@/lib/authorize";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = auth;
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant context missing" }, { status: 400 });
    }

    // Create stream
    const responseStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Helper to send events
        const sendEvent = (event, data) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch (err) {
            console.error("KDS SSE sendEvent error:", err);
            cleanup();
          }
        };

        // Send initial connection successful notification
        sendEvent("connected", { status: "ready" });

        // Listener for real-time restaurant orders updates
        const onOrdersUpdate = (eventPayload) => {
          sendEvent("update", eventPayload || { type: "refresh" });
        };

        const eventName = `restaurant-orders-${restaurantId}`;
        orderEvents.on(eventName, onOrdersUpdate);

        // Heartbeat keep-alive every 10 seconds
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
          orderEvents.off(eventName, onOrdersUpdate);
          try {
            controller.close();
          } catch (err) {
            // Ignore if stream is already closed
          }
        };

        // Listen for client abort (tab closed, navigating away)
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
    console.error("KDS SSE startup error:", error);
    return NextResponse.json({ error: "Failed to establish live connection" }, { status: 500 });
  }
}
