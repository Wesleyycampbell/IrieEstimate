"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConsultationActions({
  id,
  paymentStatus,
  meetingStatus,
}: {
  id: string;
  paymentStatus: string;
  meetingStatus: string;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function update(field: string, value: string) {
    setUpdating(true);
    await fetch("/api/consultations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    setUpdating(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
      {paymentStatus === "pending" && (
        <button
          disabled={updating}
          onClick={() => update("paymentStatus", "paid_offline")}
          className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50"
        >
          Mark as Paid
        </button>
      )}

      {meetingStatus === "requested" && (
        <button
          disabled={updating}
          onClick={() => update("meetingStatus", "scheduled")}
          className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition disabled:opacity-50"
        >
          Mark Scheduled
        </button>
      )}

      {meetingStatus === "scheduled" && (
        <button
          disabled={updating}
          onClick={() => update("meetingStatus", "completed")}
          className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50"
        >
          Mark Completed
        </button>
      )}
    </div>
  );
}
