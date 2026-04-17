import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Member } from "@/lib/models/Member";
import { Library } from "@/lib/models/Library";
import { Attendance } from "@/lib/models/Attendance";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  await connectDB();

  const filter: any = {};
  if (session?.user?.role !== "super_admin") filter.library = session?.user?.libraryId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const in5Days = new Date();
  in5Days.setDate(in5Days.getDate() + 5);

  const [totalMembers, activeMembers, todayAttendance, expiringCount, libraryCount] =
    await Promise.all([
      Member.countDocuments(filter),
      Member.countDocuments({ ...filter, isActive: true }),
      Attendance.countDocuments({ ...filter, checkIn: { $gte: today, $lt: tomorrow } }),
      Member.countDocuments({
        ...filter,
        isActive: true,
        feeStatus: { $in: ["unpaid", "partial"] },
        packageEndDate: { $gte: new Date(), $lte: in5Days },
      }),
      session?.user?.role === "super_admin" ? Library.countDocuments({ isActive: true }) : Promise.resolve(1),
    ]);

  const stats = [
    { label: "Total Members", value: totalMembers, icon: "👥", color: "bg-blue-50 text-blue-700" },
    { label: "Active Members", value: activeMembers, icon: "✅", color: "bg-green-50 text-green-700" },
    { label: "Today's Attendance", value: todayAttendance, icon: "📋", color: "bg-purple-50 text-purple-700" },
    { label: "Expiring Soon (5d)", value: expiringCount, icon: "⚠️", color: "bg-orange-50 text-orange-700" },
    ...(session?.user?.role === "super_admin"
      ? [{ label: "Total Libraries", value: libraryCount, icon: "🏛️", color: "bg-indigo-50 text-indigo-700" }]
      : []),
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Welcome back, {session?.user?.name}
          {session?.user?.libraryName ? ` — ${session.user.libraryName}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/members/new" className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="text-2xl mb-2">➕</div>
          <h3 className="font-semibold text-gray-800">Add New Member</h3>
          <p className="text-sm text-gray-500 mt-1">Register a new library member</p>
        </Link>
        <Link href="/attendance" className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-semibold text-gray-800">View Attendance</h3>
          <p className="text-sm text-gray-500 mt-1">Check today's attendance records</p>
        </Link>
        <Link href="/members?expiring=true" className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="text-2xl mb-2">⚠️</div>
          <h3 className="font-semibold text-gray-800">Expiring Members</h3>
          <p className="text-sm text-gray-500 mt-1">{expiringCount} members expiring in 5 days</p>
        </Link>
      </div>
    </div>
  );
}
