"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface AttendanceRecord {
  _id: string;
  checkIn: string;
  checkOut?: string;
  source: string;
  member: { name: string; phone: string; biometricId: string };
  library: { name: string };
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  async function fetchAttendance() {
    setLoading(true);
    const res = await fetch(`/api/attendance?date=${date}`);
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }

  async function syncBiometric() {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/attendance/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ libraryId: session?.user?.libraryId }),
    });
    const data = await res.json();
    setSyncMsg(`Synced ${data.synced} of ${data.total} records`);
    setSyncing(false);
    fetchAttendance();
  }

  useEffect(() => { fetchAttendance(); }, [date]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Attendance</h1>
        {session?.user?.role !== "receptionist" && (
          <button onClick={syncBiometric} disabled={syncing}
            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">
            {syncing ? "Syncing..." : "🔄 Sync"}
          </button>
        )}
      </div>

      {syncMsg && <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg mb-4">{syncMsg}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <span className="text-sm text-gray-500">{records.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No attendance records for this date</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Member</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Check In</th>
                    <th className="text-left px-4 py-3">Check Out</th>
                    <th className="text-left px-4 py-3">Source</th>
                    {session?.user?.role === "super_admin" && <th className="text-left px-4 py-3">Library</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.member?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.member?.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(r.checkIn).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-gray-600">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${r.source === "biometric" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                          {r.source}
                        </span>
                      </td>
                      {session?.user?.role === "super_admin" && (
                        <td className="px-4 py-3 text-gray-600">{r.library?.name}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {records.map((r) => (
                <div key={r._id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 text-sm">{r.member?.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.source === "biometric" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                      {r.source}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{r.member?.phone}</p>
                  <div className="flex gap-4 text-xs text-gray-500 pt-1">
                    <span>🟢 {new Date(r.checkIn).toLocaleTimeString()}</span>
                    <span>🔴 {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}</span>
                    {session?.user?.role === "super_admin" && <span>🏛️ {r.library?.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
