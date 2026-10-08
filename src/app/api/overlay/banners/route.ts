import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDataSource } from "@/lib/db";
import { OverlayState } from "@/lib/entities/OverlayState";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB ต่อไฟล์
const MAX_BANNERS = 5;

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
      return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 5MB" }, { status: 400 });
    }

    const db = await getDataSource();
    const overlayRepo = db.getRepository(OverlayState);
    let state = await overlayRepo.findOne({ where: { userId } });
    if (!state) state = overlayRepo.create({ userId });

    const banners = Array.isArray(state.banners) ? state.banners : [];
    if (banners.length >= MAX_BANNERS) {
      return NextResponse.json({ error: `อัปโหลดได้สูงสุด ${MAX_BANNERS} ไฟล์` }, { status: 400 });
    }

    // Upload to S3: upload/users_banner/{userId}/banner_{bannerId}.{ext}
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
    const bannerId = randomUUID();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const key = `upload/users_banner/${userId}/banner_${bannerId}.${ext}`;

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

    banners.push({ id: bannerId, url: publicUrl, key });
    state.banners = banners;
    await overlayRepo.save(state);

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error("Banner upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bannerId = searchParams.get("bannerId");
    if (!bannerId) return NextResponse.json({ error: "Missing bannerId" }, { status: 400 });

    const db = await getDataSource();
    const overlayRepo = db.getRepository(OverlayState);
    const state = await overlayRepo.findOne({ where: { userId } });
    if (!state || !Array.isArray(state.banners)) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const banner = state.banners.find((b) => b.id === bannerId);
    if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });

    // ลบไฟล์ออกจาก S3 ด้วย
    try {
      const s3 = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "auto",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || "",
          secretAccessKey: process.env.S3_SECRET_KEY || "",
        },
        forcePathStyle: true,
      });
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: banner.key }));
    } catch (e) {
      console.warn("Failed to delete banner file from S3:", e);
    }

    state.banners = state.banners.filter((b) => b.id !== bannerId);
    await overlayRepo.save(state);

    return NextResponse.json({ success: true, banners: state.banners });
  } catch (error) {
    console.error("Banner delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
