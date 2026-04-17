"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Package { _id: string; name: string; type: string; price: number; durationDays: number; library: { name: string }; isActive: boolean; }

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packages").then((r) => r.json()).then((data) => { setPackages(data); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Packages</h1>
        <Link href="/packages/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Add Package
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{pkg.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${pkg.type === "monthly" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                  {pkg.type}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">₹{pkg.price}</p>
              <p className="text-sm text-gray-500 mt-1">{pkg.durationDays} days</p>
              {pkg.library && <p className="text-xs text-gray-400 mt-2">{pkg.library.name}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
