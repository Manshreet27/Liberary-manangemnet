import { connectDB } from "@/lib/db";
import { Member } from "@/lib/models/Member";
import "@/lib/models/Package";
import "@/lib/models/Library";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (session.user.role !== "super_admin") {
    filter.library = session.user.libraryId;
  } else if (searchParams.get("library")) {
    filter.library = searchParams.get("library");
  }
  if (searchParams.get("search")) {
    filter.$or = [
      { name: { $regex: searchParams.get("search"), $options: "i" } },
      { phone: { $regex: searchParams.get("search"), $options: "i" } },
    ];
  }

  const [members, total] = await Promise.all([
    Member.find(filter).populate("package library").skip(skip).limit(limit).sort({ createdAt: -1 }),
    Member.countDocuments(filter),
  ]);

  return NextResponse.json({ members, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "super_admin") {
    // super_admin doesn't directly add members; admin/receptionist do
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();

  const libraryId = session.user.role === "super_admin" ? body.library : session.user.libraryId;

  const member = await Member.create({ ...body, library: libraryId });
  return NextResponse.json(member, { status: 201 });
}
