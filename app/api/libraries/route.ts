import { connectDB } from "@/lib/db";
import { Library } from "@/lib/models/Library";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const filter = session.user.role === "super_admin" ? {} : { _id: session.user.libraryId };
  const libraries = await Library.find(filter);
  return NextResponse.json(libraries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const library = await Library.create(body);
  return NextResponse.json(library, { status: 201 });
}
