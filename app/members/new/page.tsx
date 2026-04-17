"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Package { _id: string; name: string; type: string; price: number; durationDays: number; }
interface Library { _id: string; name: string; }

export default function NewMemberPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [packages, setPackages] = useState<Package[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", email: "", address: "",
    biometricId: "", seatNumber: "", library: "", package: "",
    packageStartDate: new Date().toISOString().split("T")[0],
    feeStatus: "unpaid", amountPaid: 0,
  });

  useEffect(() => {
    fetch("/api/packages").then((r) => r.json()).then(setPackages);
    if (session?.user?.role === "super_admin") {
      fetch("/api/libraries").then((r) => r.json()).then(setLibraries);
    }
  }, [session]);

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const selectedPkg = packages.find((p) => p._id === form.package);
    if (!selectedPkg) { setError("Select a package"); setLoading(false); return; }

    const startDate = new Date(form.packageStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + selectedPkg.durationDays);

    const payload = { ...form, packageEndDate: endDate.toISOString() };

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/members");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create member");
      setLoading(false);
    }
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl w-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Add New Member</h1>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input className={inputClass} required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input className={inputClass} required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp Number *</label>
            <input className={inputClass} required placeholder="+91XXXXXXXXXX" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Biometric ID</label>
            <input className={inputClass} value={form.biometricId} onChange={(e) => set("biometricId", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Seat Number</label>
            <input className={inputClass} value={form.seatNumber} onChange={(e) => set("seatNumber", e.target.value)} />
          </div>

          {session?.user?.role === "super_admin" && (
            <div className="col-span-1 sm:col-span-2">
              <label className={labelClass}>Library *</label>
              <select className={inputClass} required value={form.library} onChange={(e) => set("library", e.target.value)}>
                <option value="">Select Library</option>
                {libraries.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Package *</label>
            <select className={inputClass} required value={form.package} onChange={(e) => set("package", e.target.value)}>
              <option value="">Select Package</option>
              {packages.map((p) => (
                <option key={p._id} value={p._id}>{p.name} — ₹{p.price} ({p.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Date *</label>
            <input type="date" className={inputClass} required value={form.packageStartDate} onChange={(e) => set("packageStartDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Fee Status</label>
            <select className={inputClass} value={form.feeStatus} onChange={(e) => set("feeStatus", e.target.value)}>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Amount Paid (₹)</label>
            <input type="number" className={inputClass} value={form.amountPaid} onChange={(e) => set("amountPaid", Number(e.target.value))} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Add Member"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
