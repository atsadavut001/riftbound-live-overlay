import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Issue } from "@/lib/entities/Issue";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();
    const { id } = await props.params;

    const db = await getDataSource();
    const issueRepo = db.getRepository(Issue);
    const issue = await issueRepo.findOne({ where: { id } });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    issue.status = status;
    await issueRepo.save(issue);

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const db = await getDataSource();
    const issueRepo = db.getRepository(Issue);
    const issue = await issueRepo.findOne({ where: { id } });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    await issueRepo.remove(issue);

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}