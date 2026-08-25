import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Issue } from "@/lib/entities/Issue";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MoreThan } from "typeorm";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDataSource();
    const issueRepo = db.getRepository(Issue);
    const issues = await issueRepo.find({ order: { createdAt: "DESC" } });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, description } = await req.json();

    if (!email || !description) {
      return NextResponse.json({ error: "Email and description are required" }, { status: 400 });
    }

    const db = await getDataSource();
    const issueRepo = db.getRepository(Issue);

    // Rate limiting: Check if this email submitted an issue in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentIssue = await issueRepo.findOne({
      where: {
        email,
        createdAt: MoreThan(fiveMinutesAgo),
      },
    });

    if (recentIssue) {
      return NextResponse.json({ error: "คุณได้ส่งข้อเสนอแนะไปแล้ว กรุณารอสักครู่ก่อนส่งอีกครั้ง" }, { status: 429 });
    }

    const issue = issueRepo.create({
      email,
      description,
    });
    
    await issueRepo.save(issue);

    return NextResponse.json({ message: "Issue submitted successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error submitting issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}