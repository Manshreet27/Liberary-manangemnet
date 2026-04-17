import { connectDB } from "@/lib/db";
import { Package } from "@/lib/models/Package";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: any = { isActive: true };

  if (session.user.role !== "super_admin") {
    filter.library = session.user.libraryId;
  } else if (searchParams.get("library")) {
    filter.library = searchParams.get("library");
  }

  const packages = await Package.find(filter).populate("library");
  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "receptionist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const libraryId = session.user.role === "super_admin" ? body.library : session.user.libraryId;
  const pkg = await Package.create({ ...body, library: libraryId });
  return NextResponse.json(pkg, { status: 201 });
}
