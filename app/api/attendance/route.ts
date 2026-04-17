import { connectDB } from "@/lib/db";
import { Attendance } from "@/lib/models/Attendance";
import { Member } from "@/lib/models/Member";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const filter: any = { checkIn: { $gte: start, $lt: end } };
  if (session.user.role !== "super_admin") filter.library = session.user.libraryId;

  const records = await Attendance.find(filter)
    .populate("member", "name phone biometricId")
    .populate("library", "name")
    .sort({ checkIn: -1 });

  return NextResponse.json(records);
}
