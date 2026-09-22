import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDataSource } from "@/lib/db";
import { Order } from "@/lib/entities/Order";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;
    const slipFile = formData.get("slip") as File;
    
    if (!orderId || !slipFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDataSource();
    const orderRepo = db.getRepository(Order);
    
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.userId !== (session.user as any).id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Upload slip to S3
    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "auto",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
      forcePathStyle: true,
    });

    const bucket = process.env.S3_BUCKET_NAME;
    const ext = slipFile.name.split('.').pop();
    const key = `payment_slip/${order.id}.${ext}`;
    
    const buffer = Buffer.from(await slipFile.arrayBuffer());

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: slipFile.type
    }));

    const publicUrl = process.env.S3_PUBLIC_URL 
      ? `${process.env.S3_PUBLIC_URL}/${key}`
      : `${process.env.S3_ENDPOINT}/${bucket}/${key}`;

    order.slipUrl = publicUrl;
    
    // Check with SlipOK
    const slipOkUrl = process.env.SLIPOK_API_URL;
    const slipOkKey = process.env.SLIPOK_API_KEY;
    const expectedAmount = Number(order.totalAmount) + Number(order.shippingFee);

    if (slipOkUrl && slipOkKey) {
      const slipFormData = new FormData();
      slipFormData.append("files", new Blob([buffer], { type: slipFile.type }), slipFile.name);
      
      const slipOkRes = await fetch(slipOkUrl, {
        method: "POST",
        headers: {
          "x-authorization": slipOkKey
        },
        body: slipFormData
      });

      const slipOkData = await slipOkRes.json();
      
      if (slipOkData?.success && slipOkData?.data) {
        const data = slipOkData.data;
        const amount = data.amount;
        const transRef = data.transRef;
        
        // 1. Check duplicate transRef
        const duplicate = await orderRepo.findOne({ where: { transRef } });
        
        if (duplicate) {
          order.status = "slipok_fail";
        } else if (Number(amount) < expectedAmount) {
          // Amount mismatch
          order.status = "slipok_fail";
        } else {
          // Success
          order.transRef = transRef;
          order.status = "slipok_pass";
        }
      } else {
        // API failed to read slip
        order.status = "slipok_fail";
      }
    } else {
      order.status = "verifying"; // Fallback if no slipok config
    }

    await orderRepo.update(order.id, { 
      slipUrl: order.slipUrl, 
      status: order.status, 
      transRef: order.transRef 
    });
    return NextResponse.json({ success: true, slipUrl: publicUrl, status: order.status });
  } catch (error) {
    console.error("Slip upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
