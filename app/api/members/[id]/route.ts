import { connectDB } from "@/lib/db";
import { Member } from "@/lib/models/Member";
import "@/lib/models/Package";
import "@/lib/models/Library";
import { Attendance } from "@/lib/models/Attendance";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const member = await Member.findById(id).populate("package library");
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "super_admin" && member.library._id.toString() !== session.user.libraryId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const member = await Member.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(member);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const member = await Member.findById(id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // All roles can delete but only within their own library
  if (session.user.role !== "super_admin" && member.library.toString() !== session.user.libraryId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Promise.all([
    Member.findByIdAndDelete(id),
    Attendance.deleteMany({ member: id }),
  ]);

  return NextResponse.json({ success: true });
}
