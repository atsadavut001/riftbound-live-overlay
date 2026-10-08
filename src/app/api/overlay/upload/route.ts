import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDataSource } from "@/lib/db";
import { OverlayState } from "@/lib/entities/OverlayState";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PNG, JPG, WEBP" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 10MB" }, { status: 400 });
    }

    // Upload to S3: upload/users_overlay/{userId}/overlay_{userId}.{ext}
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
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const key = `upload/users_overlay/${userId}/overlay_${userId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicUrl = process.env.S3_PUBLIC_URL
      ? `${process.env.S3_PUBLIC_URL}/${key}`
      : `${process.env.S3_ENDPOINT}/${bucket}/${key}`;

    // บันทึก URL ลง OverlayState เพื่อให้หน้า overlay ใช้แสดงผล
    const db = await getDataSource();
    const overlayRepo = db.getRepository(OverlayState);
    let state = await overlayRepo.findOne({ where: { userId } });
    if (!state) state = overlayRepo.create({ userId });
    state.backgroundUrl = publicUrl;
    await overlayRepo.save(state);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Overlay upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDataSource();
    const overlayRepo = db.getRepository(OverlayState);
    const state = await overlayRepo.findOne({ where: { userId } });
    if (!state) return NextResponse.json({ error: "Overlay state not found" }, { status: 404 });

    // เคลียร์ URL (ไม่ลบไฟล์บน S3 เพื่อเผื่อย้อนกลับ)
    state.backgroundUrl = null;
    await overlayRepo.save(state);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Overlay background delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
