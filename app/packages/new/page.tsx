"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Library { _id: string; name: string; }

export default function NewPackagePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [form, setForm] = useState({ name: "", type: "monthly", price: "", durationDays: "30", library: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.role === "super_admin") {
      fetch("/api/libraries").then((r) => r.json()).then(setLibraries);
    }
  }, [session]);

  function set(field: string, value: string) {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      if (field === "type") updated.durationDays = value === "monthly" ? "30" : "365";
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), durationDays: Number(form.durationDays) }),
    });
    if (res.ok) { router.push("/packages"); }
    else { setError("Failed to create package"); setLoading(false); }
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Add Package</h1>
      </div>
      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className={labelClass}>Package Name *</label>
          <input className={inputClass} required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Type *</label>
          <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Price (₹) *</label>
          <input type="number" className={inputClass} required value={form.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Duration (days)</label>
          <input type="number" className={inputClass} value={form.durationDays} onChange={(e) => set("durationDays", e.target.value)} />
        </div>
        {session?.user?.role === "super_admin" && (
          <div>
            <label className={labelClass}>Library *</label>
            <select className={inputClass} required value={form.library} onChange={(e) => set("library", e.target.value)}>
              <option value="">Select Library</option>
              {libraries.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Add Package"}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
        </div>
      </form>
    </div>
  );
}
