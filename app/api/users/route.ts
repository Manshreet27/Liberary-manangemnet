import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "receptionist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const filter: any = {};

  if (session.user.role === "admin") {
    // Admin sees only receptionists of their library
    filter.library = session.user.libraryId;
    filter.role = "receptionist";
  }

  const users = await User.find(filter, "-password").populate("library", "name");
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "receptionist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();

  if (session.user.role === "admin") {
    if (body.role !== "receptionist") {
      return NextResponse.json({ error: "Admins can only create receptionists" }, { status: 403 });
    }
    body.library = session.user.libraryId;
  }

  // super_admin can create admin or receptionist with any library
  const existing = await User.findOne({ email: body.email });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

  const user = await User.create(body);
  const { password: _, ...safe } = user.toObject();
  return NextResponse.json(safe, { status: 201 });
}
