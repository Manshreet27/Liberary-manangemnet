"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Member {
  _id: string;
  name: string;
  phone: string;
  whatsapp: string;
  feeStatus: string;
  packageEndDate: string;
  isActive: boolean;
  package: { name: string; type: string };
  library: { name: string };
  seatNumber?: string;
}

export default function MembersPage() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(m: Member) {
    if (!confirm(`Delete "${m.name}" permanently?`)) return;
    setDeletingId(m._id);
    await fetch(`/api/members/${m._id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((x) => x._id !== m._id));
    setDeletingId(null);
  }

  async function fetchMembers() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    if (searchParams.get("expiring")) params.set("expiring", "true");
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members || []);
    setPages(data.pages || 1);
    setLoading(false);
  }

  useEffect(() => { fetchMembers(); }, [page, search]);

  const feeColor = (status: string) =>
    status === "paid" ? "text-green-600 bg-green-50" :
    status === "partial" ? "text-yellow-600 bg-yellow-50" :
    "text-red-600 bg-red-50";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Members</h1>
        <Link href="/members/new" className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">
          + Add Member
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No members found</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Package</th>
                    <th className="text-left px-4 py-3">Expiry</th>
                    <th className="text-left px-4 py-3">Fee</th>
                    <th className="text-left px-4 py-3">Seat</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                      <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{m.package?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(m.packageEndDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${feeColor(m.feeStatus)}`}>
                          {m.feeStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.seatNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/members/${m._id}`} className="text-blue-600 hover:underline text-xs">View</Link>
                          <button onClick={() => handleDelete(m)} disabled={deletingId === m._id}
                            className="text-red-500 hover:text-red-700 text-xs disabled:opacity-40">
                            {deletingId === m._id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {members.map((m) => (
                <div key={m._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.phone}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${feeColor(m.feeStatus)}`}>
                      {m.feeStatus}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>📦 {m.package?.name}</span>
                    <span>📅 {new Date(m.packageEndDate).toLocaleDateString()}</span>
                    {m.seatNumber && <span>💺 {m.seatNumber}</span>}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Link href={`/members/${m._id}`} className="text-blue-600 text-xs font-medium hover:underline">View →</Link>
                    <button onClick={() => handleDelete(m)} disabled={deletingId === m._id}
                      className="text-red-500 text-xs disabled:opacity-40">
                      {deletingId === m._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {pages > 1 && (
          <div className="p-4 border-t flex gap-2 justify-end">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40">Prev</button>
            <span className="px-3 py-1 text-sm text-gray-600">{page} / {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
