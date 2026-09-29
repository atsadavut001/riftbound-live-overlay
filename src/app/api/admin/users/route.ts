import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { User } from "@/lib/entities/User";
import { ILike } from "typeorm";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const dataSource = await getDataSource();
    const userRepository = dataSource.getRepository(User);

    const whereClause = search
      ? [
          { email: ILike(`%${search}%`) },
          { name: ILike(`%${search}%`) }
        ]
      : {};

    const users = await userRepository.find({
      where: whereClause,
      order: { createdAt: "DESC" }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
