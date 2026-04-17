"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewLibraryPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", phone: "", biometricApiUrl: "", biometricApiKey: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/libraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/libraries"); }
    else { setError("Failed to create library"); setLoading(false); }
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Add Library</h1>
      </div>
      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className={labelClass}>Library Name *</label>
          <input className={inputClass} required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <hr />
        <p className="text-sm font-medium text-gray-700">Biometric Device Settings</p>
        <div>
          <label className={labelClass}>Biometric API URL</label>
          <input className={inputClass} placeholder="http://192.168.1.100/api" value={form.biometricApiUrl} onChange={(e) => set("biometricApiUrl", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Biometric API Key</label>
          <input className={inputClass} value={form.biometricApiKey} onChange={(e) => set("biometricApiKey", e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Add Library"}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
        </div>
      </form>
    </div>
  );
}
