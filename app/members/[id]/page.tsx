"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Member {
  _id: string; name: string; phone: string; whatsapp: string; email: string;
  address: string; biometricId: string; seatNumber: string; feeStatus: string;
  amountPaid: number; packageStartDate: string; packageEndDate: string; isActive: boolean;
  package: { _id: string; name: string; type: string; price: number };
  library: { _id: string; name: string };
  alertsSent: { sentAt: string; type: string }[];
}

export default function MemberDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [editing, setEditing] = useState(false);
  const [feeStatus, setFeeStatus] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/members/${id}`).then((r) => r.json()).then((data) => {
      setMember(data);
      setFeeStatus(data.feeStatus);
      setAmountPaid(data.amountPaid);
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete "${member?.name}" permanently? All their attendance records will also be removed.`)) return;
    setDeleting(true);
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    router.push("/members");
  }

  async function savePayment() {
    setSaving(true);
    await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feeStatus, amountPaid }),
    });
    setMember((m) => m ? { ...m, feeStatus, amountPaid } : m);
    setEditing(false);
    setSaving(false);
  }

  if (!member) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const daysLeft = Math.ceil(
    (new Date(member.packageEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const feeColor = member.feeStatus === "paid" ? "text-green-600 bg-green-50" :
    member.feeStatus === "partial" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

  return (
    <div className="max-w-2xl w-full">
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">{member.name}</h1>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${feeColor}`}>
          {member.feeStatus}
        </span>
        <button onClick={handleDelete} disabled={deleting}
          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 disabled:opacity-50">
          {deleting ? "Deleting..." : "🗑 Delete"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{member.phone}</span></div>
          <div><span className="text-gray-500">WhatsApp:</span> <span className="font-medium">{member.whatsapp}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{member.email || "—"}</span></div>
          <div><span className="text-gray-500">Seat:</span> <span className="font-medium">{member.seatNumber || "—"}</span></div>
          <div><span className="text-gray-500">Library:</span> <span className="font-medium">{member.library?.name}</span></div>
          <div><span className="text-gray-500">Biometric ID:</span> <span className="font-medium">{member.biometricId || "—"}</span></div>
          <div><span className="text-gray-500">Address:</span> <span className="font-medium">{member.address || "—"}</span></div>
        </div>

        <hr />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Package:</span> <span className="font-medium">{member.package?.name}</span></div>
          <div><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{member.package?.type}</span></div>
          <div><span className="text-gray-500">Start:</span> <span className="font-medium">{new Date(member.packageStartDate).toLocaleDateString()}</span></div>
          <div><span className="text-gray-500">Expiry:</span>
            <span className={`font-medium ml-1 ${daysLeft <= 5 ? "text-red-600" : "text-gray-800"}`}>
              {new Date(member.packageEndDate).toLocaleDateString()} ({daysLeft}d left)
            </span>
          </div>
          <div><span className="text-gray-500">Package Fee:</span> <span className="font-medium">₹{member.package?.price}</span></div>
          <div><span className="text-gray-500">Amount Paid:</span> <span className="font-medium">₹{member.amountPaid}</span></div>
        </div>

        <hr />

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Status</label>
                <select value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={savePayment} disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="border px-4 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Update Payment
          </button>
        )}

        {member.alertsSent?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">WhatsApp Alerts Sent</p>
            <div className="space-y-1">
              {member.alertsSent.map((a, i) => (
                <div key={i} className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded">
                  {a.type} — {new Date(a.sentAt).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
