"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  library?: { name: string };
}

export default function StaffPage() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(u: StaffUser) {
    if (!confirm(`Delete "${u.name}" (${u.role})? This cannot be undone.`)) return;
    setDeletingId(u._id);
    await fetch(`/api/users/${u._id}`, { method: "DELETE" });
    setStaff((prev) => prev.filter((s) => s._id !== u._id));
    setDeletingId(null);
  }

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((data) => { setStaff(data); setLoading(false); });
  }, []);

  const roleColor = (role: string) =>
    role === "super_admin" ? "bg-purple-50 text-purple-700" :
    role === "admin" ? "bg-blue-50 text-blue-700" :
    "bg-green-50 text-green-700";

  const canCreate = session?.user?.role === "super_admin" || session?.user?.role === "admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Staff Management</h1>
        {canCreate && (
          <Link href="/staff/new" className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">
            + Add Staff
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No staff found</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Library</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor(u.role)}`}>
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.library?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(u)} disabled={deletingId === u._id}
                          className="text-red-500 hover:text-red-700 text-xs disabled:opacity-40">
                          {deletingId === u._id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {staff.map((u) => (
                <div key={u._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor(u.role)}`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{u.library?.name || "—"}</span>
                    <span className={`px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(u)} disabled={deletingId === u._id}
                    className="text-red-500 text-xs disabled:opacity-40">
                    {deletingId === u._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
