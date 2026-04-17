import { connectDB } from "@/lib/db";
import { Library } from "@/lib/models/Library";
import { Member } from "@/lib/models/Member";
import { Package } from "@/lib/models/Package";
import { User } from "@/lib/models/User";
import { Attendance } from "@/lib/models/Attendance";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;

  const [library, members, packages, staff] = await Promise.all([
    Library.findById(id),
    Member.find({ library: id }).populate("package", "name type price"),
    Package.find({ library: id, isActive: true }),
    User.find({ library: id }, "-password"),
  ]);

  if (!library) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalFeeCollected = members.reduce((sum: number, m: any) => sum + (m.amountPaid || 0), 0);
  const unpaidCount = members.filter((m: any) => m.feeStatus !== "paid").length;

  const in5Days = new Date();
  in5Days.setDate(in5Days.getDate() + 5);
  const expiringCount = members.filter(
    (m: any) => new Date(m.packageEndDate) <= in5Days && m.feeStatus !== "paid" && m.isActive
  ).length;

  return NextResponse.json({
    library,
    members,
    packages,
    staff,
    stats: {
      totalMembers: members.length,
      activeMembers: members.filter((m: any) => m.isActive).length,
      totalFeeCollected,
      unpaidCount,
      expiringCount,
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const library = await Library.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(library);
}

// Cascade delete: library + all members, packages, staff, attendance
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;

  await Promise.all([
    Member.deleteMany({ library: id }),
    Package.deleteMany({ library: id }),
    User.deleteMany({ library: id }),
    Attendance.deleteMany({ library: id }),
    Library.findByIdAndDelete(id),
  ]);

  return NextResponse.json({ success: true });
}
