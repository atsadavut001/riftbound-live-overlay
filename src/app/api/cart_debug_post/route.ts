export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Order } from '@/lib/entities/Order';
import { OrderItem } from '@/lib/entities/OrderItem';

export async function POST() {
  const db = await getDataSource();
  const orderRepo = db.getRepository(Order);
  const orderItemRepo = db.getRepository(OrderItem);
  
  let order = await orderRepo.findOne({
    where: { id: "634bb12d-36f5-4377-b15a-171e0c88e598" },
    relations: { items: true }
  });
  
  let orderItem = orderItemRepo.create({
    orderId: order!.id,
    shopItemId: "f17b5080-f1f7-424c-931b-c0320a321b57",
    quantity: 1,
    priceAtTime: 100
  });
  await orderItemRepo.save(orderItem);
  
  const allItems = await orderItemRepo.find({ where: { orderId: order!.id } });
  
  order!.totalAmount = 100;
  await orderRepo.save(order!);
  
  const finalItems = await orderItemRepo.find({ where: { orderId: order!.id } });
  
  return NextResponse.json({ beforeSave: allItems.length, afterSave: finalItems.length });
}
