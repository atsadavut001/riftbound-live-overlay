import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { MetaSyncLog } from "@/lib/entities/MetaSyncLog";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/meta/sync/logs — 50 most recent sync runs (admin only) */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDataSource();
  const logs = await db.getRepository(MetaSyncLog).find({
    order: { createdAt: "DESC" },
    take: 50,
  });
  return NextResponse.json(logs);
}
