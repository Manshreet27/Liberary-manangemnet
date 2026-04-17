import { connectDB } from "@/lib/db";
import { Attendance } from "@/lib/models/Attendance";
import { Member } from "@/lib/models/Member";
import { Library } from "@/lib/models/Library";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// This endpoint fetches attendance logs from the biometric device and stores them
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "receptionist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { libraryId } = await req.json();

  const library = await Library.findById(libraryId);
  if (!library) return NextResponse.json({ error: "Library not found" }, { status: 404 });

  const apiUrl = library.biometricApiUrl || process.env.BIOMETRIC_API_URL;
  const apiKey = library.biometricApiKey || process.env.BIOMETRIC_API_KEY;

  // Fetch logs from biometric device REST API
  const res = await fetch(`${apiUrl}/attendance/today`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) return NextResponse.json({ error: "Biometric API error" }, { status: 502 });

  const logs: { biometricId: string; checkIn: string; checkOut?: string }[] = await res.json();

  let synced = 0;
  for (const log of logs) {
    const member = await Member.findOne({ biometricId: log.biometricId, library: libraryId });
    if (!member) continue;

    const exists = await Attendance.findOne({
      member: member._id,
      checkIn: new Date(log.checkIn),
    });
    if (exists) continue;

    await Attendance.create({
      member: member._id,
      library: libraryId,
      biometricId: log.biometricId,
      checkIn: new Date(log.checkIn),
      checkOut: log.checkOut ? new Date(log.checkOut) : undefined,
      source: "biometric",
    });
    synced++;
  }

  return NextResponse.json({ synced, total: logs.length });
}
