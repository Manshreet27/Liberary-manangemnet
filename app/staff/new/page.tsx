"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Library { _id: string; name: string; }

export default function NewStaffPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";

  const [libraries, setLibraries] = useState<Library[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "", library: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/libraries").then((r) => r.json()).then(setLibraries);
    }
  }, [isSuperAdmin]);

  // Roles this user is allowed to create
  const allowedRoles = isSuperAdmin
    ? [{ value: "admin", label: "Admin" }, { value: "receptionist", label: "Receptionist" }]
    : [{ value: "receptionist", label: "Receptionist" }];

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/staff");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create staff");
      setLoading(false);
    }
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Add Staff</h1>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input className={inputClass} required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" className={inputClass} required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Password *</label>
          <input type="password" className={inputClass} required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Role *</label>
          <select className={inputClass} required value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="">Select Role</option>
            {allowedRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {isSuperAdmin && (
          <div>
            <label className={labelClass}>Library *</label>
            <select className={inputClass} required value={form.library} onChange={(e) => set("library", e.target.value)}>
              <option value="">Select Library</option>
              {libraries.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Creating..." : "Create Staff"}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
        </div>
      </form>
    </div>
  );
}
