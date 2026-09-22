import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getDataSource, getSafeRepository } from "@/lib/db";
import { Order } from "@/lib/entities/Order";
import { ShopItem } from "@/lib/entities/ShopItem";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const isAdmin = (session.user as any).isAdmin;
    const all = searchParams.get("all") === "true";
    
    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);

    // Auto-cancel pending orders older than 7 days and restore stock
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredOrders = await orderRepo.createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "item")
      .leftJoinAndSelect("item.shopItem", "shopItem")
      .where("order.status = :status", { status: "pending" })
      .andWhere("order.created_at < :date", { date: sevenDaysAgo })
      .getMany();

    if (expiredOrders.length > 0) {
      const shopItemRepo = (await getSafeRepository<ShopItem>("shop_item"));
      for (const order of expiredOrders) {
        if (order.items) {
          for (const item of order.items) {
            if (item.shopItem) {
              await shopItemRepo.update(item.shopItem.id, { quantity: item.shopItem.quantity + item.quantity });
            }
          }
        }
        await orderRepo.update(order.id, { status: "cancelled" });
      }
    }

    let whereClause = {};
    if (!isAdmin || !all) {
      whereClause = { userId: (session.user as any).id };
    }

    const orders = await orderRepo.find({
      where: whereClause,
      relations: { items: { shopItem: { card: true } }, user: true },
      order: { createdAt: "DESC" }
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId, action } = body;

    if (action !== "CANCEL") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);
    
    const order = await orderRepo.findOne({ 
      where: { id: orderId },
      relations: { items: { shopItem: true } }
    });
    
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.userId !== (session.user as any).id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (order.status !== "pending" && order.status !== "slipok_fail") {
      return NextResponse.json({ error: "Cannot cancel order in this status" }, { status: 400 });
    }

    order.status = "cancelled";

    // Restore stock
    const shopItemRepo = (await getSafeRepository<ShopItem>("shop_item"));
    if (order.items) {
      for (const item of order.items) {
        if (item.shopItem) {
          await shopItemRepo.update(item.shopItem.id, { quantity: item.shopItem.quantity + item.quantity });
        }
      }
    }

    await orderRepo.update(order.id, { status: "cancelled" });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order cancel error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
