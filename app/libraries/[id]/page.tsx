"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Member {
  _id: string; name: string; phone: string; feeStatus: string;
  amountPaid: number; packageEndDate: string; isActive: boolean;
  package: { name: string; type: string; price: number };
}
interface Package { _id: string; name: string; type: string; price: number; durationDays: number; }
interface Staff { _id: string; name: string; email: string; role: string; isActive: boolean; }
interface Stats {
  totalMembers: number; activeMembers: number;
  totalFeeCollected: number; unpaidCount: number; expiringCount: number;
}
interface Library { _id: string; name: string; address: string; phone: string; }

const emptyForm = { name: "", email: "", password: "", phone: "", role: "admin" };

export default function LibraryDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<{ library: Library; members: Member[]; packages: Package[]; staff: Staff[]; stats: Stats } | null>(null);
  const [tab, setTab] = useState<"members" | "packages" | "staff">("members");
  const [deleting, setDeleting] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch(`/api/libraries/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  async function handleDeleteLibrary() {
    if (!confirm(`Delete "${data?.library.name}" and ALL its data permanently? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/libraries/${id}`, { method: "DELETE" });
    router.push("/libraries");
  }

  async function handleDeleteStaff(u: Staff) {
    if (!confirm(`Delete "${u.name}" (${u.role})? This cannot be undone.`)) return;
    setDeletingStaffId(u._id);
    await fetch(`/api/users/${u._id}`, { method: "DELETE" });
    setData((d) => d ? { ...d, staff: d.staff.filter((s) => s._id !== u._id) } : d);
    setDeletingStaffId(null);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, library: id }),
    });
    if (res.ok) {
      const newUser = await res.json();
      setData((d) => d ? { ...d, staff: [...d.staff, newUser] } : d);
      setShowModal(false);
      setForm(emptyForm);
    } else {
      const err = await res.json();
      setFormError(err.error || "Failed to create staff");
    }
    setSaving(false);
  }

  if (!data) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const { library, members, packages, staff, stats } = data;

  const feeColor = (s: string) =>
    s === "paid" ? "text-green-600 bg-green-50" :
    s === "partial" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

  const roleColor = (r: string) =>
    r === "admin" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700";

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{library.name}</h1>
          <p className="text-sm text-gray-500">{library.address} {library.phone && `· ${library.phone}`}</p>
        </div>
        <button onClick={handleDeleteLibrary} disabled={deleting}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
          {deleting ? "Deleting..." : "🗑 Delete Library"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Members", value: stats.totalMembers, color: "bg-blue-50 text-blue-700" },
          { label: "Active Members", value: stats.activeMembers, color: "bg-green-50 text-green-700" },
          { label: "Fee Collected", value: `₹${stats.totalFeeCollected}`, color: "bg-purple-50 text-purple-700" },
          { label: "Unpaid", value: stats.unpaidCount, color: "bg-red-50 text-red-700" },
          { label: "Expiring (5d)", value: stats.expiringCount, color: "bg-orange-50 text-orange-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(["members", "packages", "staff"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
              {t} ({t === "members" ? members.length : t === "packages" ? packages.length : staff.length})
            </button>
          ))}
        </div>
        {tab === "staff" && (
          <button onClick={() => { setShowModal(true); setFormError(""); setForm(emptyForm); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            + Add Staff
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Members Tab */}
        {tab === "members" && (
          members.length === 0
            ? <div className="p-8 text-center text-gray-400">No members</div>
            : <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Package</th>
                    <th className="text-left px-4 py-3">Expiry</th>
                    <th className="text-left px-4 py-3">Fee Status</th>
                    <th className="text-left px-4 py-3">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <Link href={`/members/${m._id}`} className="hover:text-blue-600">{m.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{m.package?.name || "—"}</td>
                      <td className={`px-4 py-3 text-sm ${new Date(m.packageEndDate) <= new Date(Date.now() + 5 * 86400000) ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {new Date(m.packageEndDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${feeColor(m.feeStatus)}`}>{m.feeStatus}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">₹{m.amountPaid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {/* Packages Tab */}
        {tab === "packages" && (
          packages.length === 0
            ? <div className="p-8 text-center text-gray-400">No packages</div>
            : <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Price</th>
                    <th className="text-left px-4 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {packages.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${p.type === "monthly" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>{p.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">₹{p.price}</td>
                      <td className="px-4 py-3 text-gray-600">{p.durationDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {/* Staff Tab */}
        {tab === "staff" && (
          staff.length === 0
            ? <div className="p-8 text-center text-gray-400">No staff yet — click "Add Staff" to create one</div>
            : <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor(u.role)}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteStaff(u)} disabled={deletingStaffId === u._id}
                          className="text-red-500 hover:text-red-700 text-xs disabled:opacity-40">
                          {deletingStaffId === u._id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Add Staff — {library.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {formError && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{formError}</p>}
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input className={inputClass} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" className={inputClass} required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" className={inputClass} required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Creating..." : "Create Staff"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
