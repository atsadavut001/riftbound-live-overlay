import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDataSource, getSafeRepository } from "@/lib/db";
import { Order } from "@/lib/entities/Order";
import { ShopItem } from "@/lib/entities/ShopItem";
import promptpayQr from "promptpay-qr";
import qrcode from "qrcode";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);
    
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.userId !== (session.user as any).id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Update status if it's cart
    if (order.status === "cart") {
      const orderWithItems = await orderRepo.findOne({ 
        where: { id: orderId },
        relations: { items: { shopItem: true } }
      });
      
      if (orderWithItems && orderWithItems.items) {
        const shopItemRepo = (await getSafeRepository<ShopItem>("shop_item"));
        
        // Deduct stock
        for (const item of orderWithItems.items) {
          if (item.shopItem) {
            await shopItemRepo.update(item.shopItem.id, { 
              quantity: Math.max(0, item.shopItem.quantity - item.quantity) 
            });
          }
        }
      }

      await orderRepo.update(order.id, { status: "pending" });
      order.status = "pending";
    }

    // Generate QR if not exists
    if (!order.qrUrl) {
      const target = process.env.PROMPTPAY_TARGET;
      if (!target) return NextResponse.json({ error: "PROMPTPAY_TARGET not configured" }, { status: 500 });
      
      const amount = Number(order.totalAmount) + Number(order.shippingFee);
      const payload = promptpayQr(target, { amount });
      
      const qrBuffer = await qrcode.toBuffer(payload, { type: 'png' });

      const s3 = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "auto",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || "",
          secretAccessKey: process.env.S3_SECRET_KEY || "",
        },
        forcePathStyle: true, // often needed for custom endpoints like minio or r2
      });

      const bucket = process.env.S3_BUCKET_NAME;
      const key = `qr_code/${order.id}.png`;

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: qrBuffer,
        ContentType: "image/png"
      }));

      // In a real scenario, you'd get the public URL based on endpoint and bucket.
      // E.g. https://<endpoint>/<bucket>/<key> or a CDN url.
      const publicUrl = process.env.S3_PUBLIC_URL 
        ? `${process.env.S3_PUBLIC_URL}/${key}`
        : `${process.env.S3_ENDPOINT}/${bucket}/${key}`;

      order.qrUrl = publicUrl;
      await orderRepo.update(order.id, { qrUrl: order.qrUrl });
    }

    return NextResponse.json({ success: true, qrUrl: order.qrUrl, status: order.status });
  } catch (error) {
    console.error("QR Generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
