import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { User } from "@/lib/entities/User";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const dataSource = await getDataSource();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOneBy({ id });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.name !== undefined) user.name = body.name;
    if (body.isAdmin !== undefined) user.isAdmin = body.isAdmin;

    await userRepository.save(user);

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const dataSource = await getDataSource();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOneBy({ id });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await userRepository.remove(user);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
