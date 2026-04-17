import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "receptionist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent deleting yourself
  if (target._id.toString() === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // Admin can only delete receptionists of their own library
  if (session.user.role === "admin") {
    if (target.role !== "receptionist" || target.library?.toString() !== session.user.libraryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await User.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
