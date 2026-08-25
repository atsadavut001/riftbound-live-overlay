import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { OverlayState } from "@/lib/entities/OverlayState";
import { User } from "@/lib/entities/User";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = await getDataSource();
    const overlayRepo = db.getRepository(OverlayState);

    let state = await overlayRepo.findOne({ where: { userId: id } });

    if (!state) {
      // ถ้ายังไม่มี State ให้สร้างค่าเริ่มต้น
      const userRepo = db.getRepository(User);
      const user = await userRepo.findOne({ where: { id } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      state = overlayRepo.create({
        userId: id,
        players: [
          { name: "Player 1", gamesWon: 0, points: 0 },
          { name: "Player 2", gamesWon: 0, points: 0 },
        ],
        format: "BO3",
        maxPoints: 8,
        points: { a: 0, b: 0 },
        event: { round: "Round 1", timerVisible: true, timerSeconds: 0 },
        cards: { auto: false, seconds: 5, lists: [[], []] }
      });
      await overlayRepo.save(state);
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error("GET OverlayState Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const db = await getDataSource();
    const overlayRepo = db.getRepository(OverlayState);

    let state = await overlayRepo.findOne({ where: { userId: id } });
    if (!state) {
      state = overlayRepo.create({ userId: id });
    }

    // อัปเดตข้อมูล
    if (body.players) state.players = body.players;
    if (body.format) state.format = body.format;
    if (body.event) state.event = body.event;
    if (body.points) state.points = body.points;
    if (body.cards) state.cards = body.cards;
    
    if (body.timerEndTime !== undefined) state.timerEndTime = body.timerEndTime;
    if (body.timerMinutes !== undefined) state.timerMinutes = body.timerMinutes;
    if (body.timerPausedRemaining !== undefined) state.timerPausedRemaining = body.timerPausedRemaining;
    if (body.maxPoints !== undefined) state.maxPoints = body.maxPoints;
    if (body.layout !== undefined) state.layout = body.layout;

    await overlayRepo.save(state);

    return NextResponse.json(state);
  } catch (error) {
    console.error("POST OverlayState Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
