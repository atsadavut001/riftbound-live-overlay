import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDataSource } from "@/lib/db";
import { Order } from "@/lib/entities/Order";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, action, trackingNumber, courier } = body;

    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);
    
    const order = await orderRepo.findOne({ 
      where: { id: orderId },
      relations: { items: { shopItem: true } }
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === "NEXT_STATUS") {
      if (order.status === "verifying" || order.status === "slipok_pass" || order.status === "slipok_fail") {
        order.status = "paid";
      } else if (order.status === "paid") {
        if (!trackingNumber || !courier) {
          return NextResponse.json({ error: "Missing tracking info" }, { status: 400 });
        }
        order.status = "shipped";
        order.trackingNumber = trackingNumber;
        order.courier = courier;
      }
    } else if (action === "REJECT_SLIP") {
      order.status = "slipok_fail";
    } else if (action === "CANCEL") {
      if (order.status === "shipped") {
        return NextResponse.json({ error: "Cannot cancel a shipped order" }, { status: 400 });
      }
      if (order.status !== "cancelled") {
        order.status = "cancelled";
        // Restore stock
        const { ShopItem } = require("@/lib/entities/ShopItem");
        const shopItemRepo = db.getRepository(ShopItem);
        if (order.items) {
          for (const item of order.items) {
            if (item.shopItem) {
              item.shopItem.quantity += item.quantity;
              await shopItemRepo.save(item.shopItem);
            }
          }
        }
      }
    }

    await orderRepo.save(order);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
