"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Library { _id: string; name: string; address: string; phone: string; isActive: boolean; }

export default function LibrariesPage() {
  const router = useRouter();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/libraries").then((r) => r.json()).then((data) => {
      setLibraries(data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(lib: Library) {
    if (!confirm(`Delete "${lib.name}" and ALL its data permanently? This cannot be undone.`)) return;
    setDeletingId(lib._id);
    await fetch(`/api/libraries/${lib._id}`, { method: "DELETE" });
    setLibraries((prev) => prev.filter((l) => l._id !== lib._id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Libraries</h1>
        <Link href="/libraries/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Add Library
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : libraries.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No libraries yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraries.map((lib) => (
            <div key={lib._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 cursor-pointer" onClick={() => router.push(`/libraries/${lib._id}`)}>
                  <h3 className="font-semibold text-gray-800 hover:text-blue-600">{lib.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{lib.address || "No address"}</p>
                  <p className="text-sm text-gray-500">{lib.phone || "No phone"}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${lib.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  {lib.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link href={`/libraries/${lib._id}`}
                  className="flex-1 text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
                  View Details →
                </Link>
                <button onClick={() => handleDelete(lib)} disabled={deletingId === lib._id}
                  className="text-xs text-red-500 hover:text-red-700 font-medium py-1 px-2 disabled:opacity-40">
                  {deletingId === lib._id ? "Deleting..." : "🗑 Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
