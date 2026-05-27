import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/getTenant";
import { getAuthorizedUser } from "@/lib/authorize";
import { rateLimit } from "@/lib/rate-limit";
import { signOrder } from "@/lib/orderAuth";
import { orderEvents } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { tableNumber, customerName, cartItems, restaurantId: bodyRestaurantId, couponCode } = await req.json();
    
    // For POST orders, we don't strictly require a session (customers can order)
    // But we MUST identify a valid restaurant.
    const urlRestaurantId = await getTenantId(req);
    const finalRestaurantId = urlRestaurantId || bodyRestaurantId;
    
    if (!finalRestaurantId) {
      return NextResponse.json({ error: "Restaurant context missing. Please scan QR again." }, { status: 400 });
    }

    // --- ANTI-SPAM RATE LIMITING ---
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
    
    // 1. IP-based limit: Max 5 order submissions per 1 minute
    const ipAllowed = await rateLimit(`order-ip-${ip}`, 5, 60000);
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many order requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    // 2. Table-based limit: Max 8 order submissions per 5 minutes to prevent targeted table spam
    const tableAllowed = await rateLimit(`order-table-${finalRestaurantId}-${tableNumber}`, 8, 300000);
    if (!tableAllowed) {
      return NextResponse.json(
        { error: "This table is placing orders too quickly. Please wait a few minutes." },
        { status: 429 }
      );
    }

    // Verify restaurant exists and is active
    const activeRestaurant = await prisma.restaurant.findFirst({
      where: { id: finalRestaurantId, isDeleted: false, isActive: true }
    });

    if (!activeRestaurant) {
      return NextResponse.json({ error: "Restaurant not found or inactive." }, { status: 404 });
    }

    // Fetch restaurant to get current fees and taxes
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: finalRestaurantId },
      select: { platformFee: true, commissionPercent: true, gstPercent: true }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
    }

    // Verify item pricing from the database to prevent pricing bypass/manipulation
    const menuItemIds = cartItems.map(item => item.id);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: finalRestaurantId
      }
    });

    let newItemsTotal = 0;
    for (const item of cartItems) {
      const dbItem = dbMenuItems.find(d => d.id === item.id);
      if (!dbItem) {
        return NextResponse.json({ error: `Menu item with ID ${item.id} not found.` }, { status: 400 });
      }
      const price = item.size === "Half" && dbItem.halfPrice ? dbItem.halfPrice : dbItem.price;
      newItemsTotal += price * item.quantity;
    }

    // Verify Coupon if provided
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), restaurantId: finalRestaurantId, isActive: true }
      });
      if (coupon && newItemsTotal >= coupon.minOrderValue) {
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (newItemsTotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
        } else {
          discountAmount = coupon.discountValue;
        }
        if (discountAmount > newItemsTotal) discountAmount = newItemsTotal;
        appliedCouponCode = coupon.code;
      }
    }

    // Wrap existing order update and new order creation in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if table already has an unpaid "Active" order (can be PREPARING or COMPLETED but not closed)
      let existingOrder = await tx.order.findFirst({
        where: { 
          tableNumber: parseInt(tableNumber), 
          isPaid: false,
          status: { not: "CLOSED" },
          restaurantId: finalRestaurantId
        },
        include: { items: true }
      });

      if (existingOrder) {
        // Find the highest round number currently in the order
        const currentMaxRound = existingOrder.items.reduce(
          (max, item) => (item.roundNumber > max ? item.roundNumber : max), 
          0
        );
        const nextRound = currentMaxRound + 1;

        // Calculate historical pricing for existing order update
        const newSubTotal = existingOrder.subTotal + newItemsTotal;
        const newDiscountAmount = existingOrder.discountAmount + discountAmount;
        const taxableAmount = Math.max(0, newSubTotal - newDiscountAmount);
        const newTaxAmount = (taxableAmount * restaurant.gstPercent) / 100;
        const newTotalAmount = taxableAmount + newTaxAmount;

        // Add items to existing order and reset flow
        await tx.order.update({
          where: { id: existingOrder.id },
          data: { 
            subTotal: newSubTotal,
            discountAmount: newDiscountAmount,
            taxAmount: newTaxAmount,
            totalAmount: newTotalAmount,
            couponCode: appliedCouponCode || existingOrder.couponCode,
            status: "ACTIVE",
            isBillRequested: false,
            isBillApproved: false,
            paymentMode: null
          }
        });

        // Insert new items
        for (const item of cartItems) {
          await tx.orderItem.create({
            data: { 
              orderId: existingOrder.id, 
              menuItemId: item.id, 
              quantity: item.quantity,
              size: item.size || "Full",
              roundNumber: nextRound
            }
          });
        }
        return { isNew: false, orderId: existingOrder.id };

      } else {
        // Calculate pricing for fresh order
        const subTotal = newItemsTotal;
        const taxableAmount = Math.max(0, subTotal - discountAmount);
        const taxAmount = (taxableAmount * restaurant.gstPercent) / 100;
        const totalAmount = taxableAmount + taxAmount;

        // Create fresh order
        const newOrder = await tx.order.create({
          data: {
            tableNumber: parseInt(tableNumber),
            customerName,
            subTotal,
            discountAmount,
            taxAmount,
            totalAmount,
            couponCode: appliedCouponCode,
            platformFeeCharged: restaurant.platformFee,
            commissionCharged: restaurant.commissionPercent,
            restaurantId: finalRestaurantId,
            items: {
              create: cartItems.map(item => ({
                menuItemId: item.id,
                quantity: item.quantity,
                size: item.size || "Full"
              }))
            }
          }
        });
        return { isNew: true, orderId: newOrder.id };
      }
    });

    // Emit restaurant event for KDS to fetch fresh orders
    try {
      orderEvents.emit(`restaurant-orders-${finalRestaurantId}`, { type: result.isNew ? "new" : "update", orderId: result.orderId });
    } catch (e) {
      console.error("Failed to emit orderEvent:", e);
    }

    if (result.isNew) {
      return NextResponse.json({ message: "New order placed!", orderId: result.orderId, orderToken: signOrder(result.orderId) }, { status: 201 });
    } else {
      return NextResponse.json({ message: "Items added to existing order!", orderId: result.orderId, orderToken: signOrder(result.orderId) }, { status: 200 });
    }
  } catch (error) {
    console.error("Order Poster Error:", error);
    return NextResponse.json({ error: "Order failed" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin/Vendor only." }, { status: 401 });
    }

    const { restaurantId } = auth;
    let finalRestaurantId = restaurantId;

    if (auth.role === "SUPER_ADMIN" && !finalRestaurantId) {
      const { searchParams } = new URL(req.url);
      finalRestaurantId = searchParams.get("restaurantId");
    }

    if (!finalRestaurantId) {
      return NextResponse.json({ error: "Restaurant context missing." }, { status: 400 });
    }

    // Database se saare orders uthao jo abhi active/preparing/completed hain (closed nahi hain)
    const orders = await prisma.order.findMany({
      where: { 
        status: { not: "CLOSED" },
        restaurantId: finalRestaurantId 
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            menuItem: true, // Saath mein menu item ka naam aur price bhi laao
          },
        },
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}