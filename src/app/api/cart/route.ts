export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getDataSource, getSafeRepository } from "@/lib/db";
import { Order } from "@/lib/entities/Order";
import { OrderItem } from "@/lib/entities/OrderItem";
import { ShopItem } from "@/lib/entities/ShopItem";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);
    
    const order = await orderRepo.createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "item")
      .leftJoinAndSelect("item.shopItem", "shopItem")
      .leftJoinAndSelect("shopItem.card", "card")
      .where("order.userId = :userId", { userId: (session.user as any).id })
      .andWhere("order.status = :status", { status: "cart" })
      .getOne();
    if (order) {
      let currentSubtotal = 0;
      for (const item of order.items) {
        if (item.shopItem) {
          const currentPrice = Number(item.shopItem.price) || 0;
          currentSubtotal += currentPrice * item.quantity;
          // Optionally update priceAtTime to reflect current price in cart
          item.priceAtTime = currentPrice; 
        }
      }
      order.totalAmount = currentSubtotal;
    }
    
    return NextResponse.json(order || { items: [], totalAmount: 0, shippingFee: 50 });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { shopItemId, quantity = 1 } = body;
    
    const db = await getDataSource();
    const shopItemRepo = (await getSafeRepository<ShopItem>("shop_item"));
    const orderRepo = db.getRepository(Order);
    const orderItemRepo = db.getRepository(OrderItem);
    
    const shopItem = await shopItemRepo.findOne({ where: { id: shopItemId } });
    if (!shopItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    
    // Find active cart
    let order = await orderRepo.findOne({
      where: { userId: (session.user as any).id, status: "cart" },
      relations: { items: true }
    });
    
    if (!order) {
      order = orderRepo.create({
        userId: (session.user as any).id,
        status: "cart",
        totalAmount: 0,
        shippingFee: 50
      });
      const insertResult = await orderRepo.insert(order);
      order.id = insertResult.identifiers[0].id;
      order.items = [];
    }
    
    // Check if item already in cart
    let orderItem = await orderItemRepo.findOne({
      where: { orderId: order.id, shopItemId }
    });
    
    if (orderItem) {
      orderItem.quantity += quantity;
      await orderItemRepo.update(orderItem.id, { quantity: orderItem.quantity });
    } else {
      orderItem = orderItemRepo.create({
        orderId: order.id,
        shopItemId,
        quantity,
        priceAtTime: shopItem.price
      });
      const insertResult = await orderItemRepo.insert(orderItem);
      orderItem.id = insertResult.identifiers[0].id;
    }
    
    // Recalculate total
    const allItems = await orderItemRepo.find({ where: { orderId: order.id } });
    const total = allItems.reduce((acc, item) => acc + (Number(item.priceAtTime) * item.quantity), 0);
    await orderRepo.update(order.id, { totalAmount: total });
    
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { orderItemId, quantity } = body;
    
    if (quantity <= 0) {
       return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    
    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);
    const orderItemRepo = db.getRepository(OrderItem);
    
    const orderItem = await orderItemRepo.findOne({ 
       where: { id: orderItemId },
       relations: { shopItem: true, order: true }
    });
    
    if (!orderItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (orderItem.order.userId !== (session.user as any).id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    if (quantity > orderItem.shopItem.quantity) {
       return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    
    orderItem.quantity = quantity;
    await orderItemRepo.update(orderItem.id, { quantity: orderItem.quantity });
    
    const allItems = await orderItemRepo.find({ where: { orderId: orderItem.orderId } });
    const total = allItems.reduce((acc, item) => acc + (Number(item.priceAtTime) * item.quantity), 0);
    await orderRepo.update(orderItem.orderId, { totalAmount: total });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { orderItemId } = body;
    
    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);
    const orderItemRepo = db.getRepository(OrderItem);
    
    const orderItem = await orderItemRepo.findOne({ 
       where: { id: orderItemId },
       relations: { order: true }
    });
    
    if (!orderItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (orderItem.order.userId !== (session.user as any).id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const orderId = orderItem.orderId;
    
    await orderItemRepo.delete(orderItem.id);
    
    const allItems = await orderItemRepo.find({ where: { orderId: orderId } });
    const total = allItems.reduce((acc, item) => acc + (Number(item.priceAtTime) * item.quantity), 0);
    
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (order) {
      await orderRepo.update(orderId, { totalAmount: total });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
