"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Member { _id: string; name: string; phone: string; feeStatus: string; amountPaid: number; packageEndDate: string; isActive: boolean; package: { name: string; type: string; price: number }; }
interface Package { _id: string; name: string; type: string; price: number; durationDays: number; }
interface Staff { _id: string; name: string; email: string; role: string; isActive: boolean; }
interface Stats { totalMembers: number; activeMembers: number; totalFeeCollected: number; unpaidCount: number; expiringCount: number; }
interface Library { _id: string; name: string; address: string; phone: string; }

type ModalType = "staff" | "member" | "package" | null;

const emptyStaff = { name: "", email: "", password: "", phone: "", role: "admin" };
const emptyMember = { name: "", phone: "", whatsapp: "", email: "", address: "", biometricId: "", seatNumber: "", package: "", packageStartDate: new Date().toISOString().split("T")[0], feeStatus: "unpaid", amountPaid: 0 };
const emptyPackage = { name: "", type: "monthly", price: "", durationDays: "30" };

export default function LibraryDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<{ library: Library; members: Member[]; packages: Package[]; staff: Staff[]; stats: Stats } | null>(null);
  const [tab, setTab] = useState<"members" | "packages" | "staff">("members");
  const [deleting, setDeleting] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [staffForm, setStaffForm] = useState(emptyStaff);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [packageForm, setPackageForm] = useState(emptyPackage);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch(`/api/libraries/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  function openModal(type: ModalType) {
    setFormError("");
    setStaffForm(emptyStaff);
    setMemberForm({ ...emptyMember, packageStartDate: new Date().toISOString().split("T")[0] });
    setPackageForm(emptyPackage);
    setModal(type);
  }

  async function handleDeleteLibrary() {
    if (!confirm(`Delete "${data?.library.name}" and ALL its data permanently?`)) return;
    setDeleting(true);
    await fetch(`/api/libraries/${id}`, { method: "DELETE" });
    router.push("/libraries");
  }

  async function handleDeleteStaff(u: Staff) {
    if (!confirm(`Delete "${u.name}" (${u.role})?`)) return;
    setDeletingStaffId(u._id);
    await fetch(`/api/users/${u._id}`, { method: "DELETE" });
    setData((d) => d ? { ...d, staff: d.staff.filter((s) => s._id !== u._id) } : d);
    setDeletingStaffId(null);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...staffForm, library: id }) });
    if (res.ok) {
      const u = await res.json();
      setData((d) => d ? { ...d, staff: [...d.staff, u] } : d);
      setModal(null);
    } else { setFormError((await res.json()).error || "Failed"); }
    setSaving(false);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const pkg = data?.packages.find((p) => p._id === memberForm.package);
    if (!pkg) { setFormError("Select a package"); setSaving(false); return; }
    const endDate = new Date(memberForm.packageStartDate);
    endDate.setDate(endDate.getDate() + pkg.durationDays);
    const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...memberForm, library: id, packageEndDate: endDate.toISOString() }) });
    if (res.ok) {
      const m = await res.json();
      setData((d) => d ? { ...d, members: [...d.members, m], stats: { ...d.stats, totalMembers: d.stats.totalMembers + 1, activeMembers: d.stats.activeMembers + 1 } } : d);
      setModal(null);
    } else { setFormError((await res.json()).error || "Failed"); }
    setSaving(false);
  }

  async function handleAddPackage(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const res = await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...packageForm, library: id, price: Number(packageForm.price), durationDays: Number(packageForm.durationDays) }) });
    if (res.ok) {
      const p = await res.json();
      setData((d) => d ? { ...d, packages: [...d.packages, p] } : d);
      setModal(null);
    } else { setFormError((await res.json()).error || "Failed"); }
    setSaving(false);
  }

  if (!data) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  const { library, members, packages, staff, stats } = data;

  const feeColor = (s: string) => s === "paid" ? "text-green-600 bg-green-50" : s === "partial" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";
  const roleColor = (r: string) => r === "admin" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700";
  const ic = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const lc = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{library.name}</h1>
          <p className="text-sm text-gray-500">{library.address} {library.phone && `· ${library.phone}`}</p>
        </div>
        <button onClick={handleDeleteLibrary} disabled={deleting} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
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

      {/* Tabs + Add Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(["members", "packages", "staff"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
              {t} ({t === "members" ? members.length : t === "packages" ? packages.length : staff.length})
            </button>
          ))}
        </div>
        <button onClick={() => openModal(tab === "members" ? "member" : tab === "packages" ? "package" : "staff")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 capitalize">
          + Add {tab === "members" ? "Member" : tab === "packages" ? "Package" : "Staff"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Members Tab */}
        {tab === "members" && (
          members.length === 0
            ? <div className="p-8 text-center text-gray-400">No members yet — click "+ Add Member"</div>
            : <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Package</th>
                    <th className="text-left px-4 py-3">Expiry</th>
                    <th className="text-left px-4 py-3">Fee</th>
                    <th className="text-left px-4 py-3">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium"><Link href={`/members/${m._id}`} className="hover:text-blue-600">{m.name}</Link></td>
                      <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{m.package?.name || "—"}</td>
                      <td className={`px-4 py-3 text-sm ${new Date(m.packageEndDate) <= new Date(Date.now() + 5 * 86400000) ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {new Date(m.packageEndDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${feeColor(m.feeStatus)}`}>{m.feeStatus}</span></td>
                      <td className="px-4 py-3 text-gray-600">₹{m.amountPaid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {/* Packages Tab */}
        {tab === "packages" && (
          packages.length === 0
            ? <div className="p-8 text-center text-gray-400">No packages yet — click "+ Add Package"</div>
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
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${p.type === "monthly" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>{p.type}</span></td>
                      <td className="px-4 py-3 font-medium text-gray-800">₹{p.price}</td>
                      <td className="px-4 py-3 text-gray-600">{p.durationDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {/* Staff Tab */}
        {tab === "staff" && (
          staff.length === 0
            ? <div className="p-8 text-center text-gray-400">No staff yet — click "+ Add Staff"</div>
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
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor(u.role)}`}>{u.role}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteStaff(u)} disabled={deletingStaffId === u._id} className="text-red-500 hover:text-red-700 text-xs disabled:opacity-40">
                          {deletingStaffId === u._id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}
      </div>

      {/* ── MODALS ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {modal === "staff" ? "Add Staff" : modal === "member" ? "Add Member" : "Add Package"} — {library.name}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {formError && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{formError}</p>}

            {/* Staff Form */}
            {modal === "staff" && (
              <form onSubmit={handleAddStaff} className="space-y-3">
                <div><label className={lc}>Full Name *</label><input className={ic} required value={staffForm.name} onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div><label className={lc}>Email *</label><input type="email" className={ic} required value={staffForm.email} onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))} /></div>
                <div><label className={lc}>Password *</label><input type="password" className={ic} required minLength={6} value={staffForm.password} onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))} /></div>
                <div><label className={lc}>Phone</label><input className={ic} value={staffForm.phone} onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                <div>
                  <label className={lc}>Role *</label>
                  <select className={ic} value={staffForm.role} onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}>
                    <option value="admin">Admin</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </div>
                <ModalButtons saving={saving} onCancel={() => setModal(null)} label="Create Staff" />
              </form>
            )}

            {/* Member Form */}
            {modal === "member" && (
              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>Full Name *</label><input className={ic} required value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className={lc}>Phone *</label><input className={ic} required value={memberForm.phone} onChange={(e) => setMemberForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                  <div><label className={lc}>WhatsApp *</label><input className={ic} required placeholder="+91XXXXXXXXXX" value={memberForm.whatsapp} onChange={(e) => setMemberForm((f) => ({ ...f, whatsapp: e.target.value }))} /></div>
                  <div><label className={lc}>Email</label><input type="email" className={ic} value={memberForm.email} onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))} /></div>
                  <div><label className={lc}>Seat No.</label><input className={ic} value={memberForm.seatNumber} onChange={(e) => setMemberForm((f) => ({ ...f, seatNumber: e.target.value }))} /></div>
                  <div><label className={lc}>Biometric ID</label><input className={ic} value={memberForm.biometricId} onChange={(e) => setMemberForm((f) => ({ ...f, biometricId: e.target.value }))} /></div>
                  <div className="col-span-2"><label className={lc}>Address</label><input className={ic} value={memberForm.address} onChange={(e) => setMemberForm((f) => ({ ...f, address: e.target.value }))} /></div>
                  <div className="col-span-2">
                    <label className={lc}>Package *</label>
                    {packages.length === 0
                      ? <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">No packages yet — add a package first from the Packages tab.</p>
                      : <select className={ic} required value={memberForm.package} onChange={(e) => setMemberForm((f) => ({ ...f, package: e.target.value }))}>
                          <option value="">Select Package</option>
                          {packages.map((p) => <option key={p._id} value={p._id}>{p.name} — ₹{p.price} ({p.type})</option>)}
                        </select>
                    }
                  </div>
                  <div><label className={lc}>Start Date *</label><input type="date" className={ic} required value={memberForm.packageStartDate} onChange={(e) => setMemberForm((f) => ({ ...f, packageStartDate: e.target.value }))} /></div>
                  <div>
                    <label className={lc}>Fee Status</label>
                    <select className={ic} value={memberForm.feeStatus} onChange={(e) => setMemberForm((f) => ({ ...f, feeStatus: e.target.value }))}>
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  <div className="col-span-2"><label className={lc}>Amount Paid (₹)</label><input type="number" className={ic} value={memberForm.amountPaid} onChange={(e) => setMemberForm((f) => ({ ...f, amountPaid: Number(e.target.value) }))} /></div>
                </div>
                <ModalButtons saving={saving} onCancel={() => setModal(null)} label="Add Member" />
              </form>
            )}

            {/* Package Form */}
            {modal === "package" && (
              <form onSubmit={handleAddPackage} className="space-y-3">
                <div><label className={lc}>Package Name *</label><input className={ic} required value={packageForm.name} onChange={(e) => setPackageForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div>
                  <label className={lc}>Type *</label>
                  <select className={ic} value={packageForm.type} onChange={(e) => setPackageForm((f) => ({ ...f, type: e.target.value, durationDays: e.target.value === "monthly" ? "30" : "365" }))}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div><label className={lc}>Price (₹) *</label><input type="number" className={ic} required value={packageForm.price} onChange={(e) => setPackageForm((f) => ({ ...f, price: e.target.value }))} /></div>
                <div><label className={lc}>Duration (days)</label><input type="number" className={ic} value={packageForm.durationDays} onChange={(e) => setPackageForm((f) => ({ ...f, durationDays: e.target.value }))} /></div>
                <ModalButtons saving={saving} onCancel={() => setModal(null)} label="Add Package" />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModalButtons({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {saving ? "Saving..." : label}
      </button>
      <button type="button" onClick={onCancel} className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
    </div>
  );
}
