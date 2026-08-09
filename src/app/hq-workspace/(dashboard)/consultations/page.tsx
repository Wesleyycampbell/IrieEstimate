import { db } from "@/db";
import { consultationRequests, leads } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ConsultationActions from "./consultation-actions";

export default async function ConsultationsPage() {
  const requests = await db
    .select({
      id: consultationRequests.id,
      siteAddress: consultationRequests.siteAddress,
      preferredDate: consultationRequests.preferredDate,
      notes: consultationRequests.notes,
      paymentStatus: consultationRequests.paymentStatus,
      meetingStatus: consultationRequests.meetingStatus,
      createdAt: consultationRequests.createdAt,
      contactValue: leads.contactValue,
      contactType: leads.contactType,
    })
    .from(consultationRequests)
    .leftJoin(leads, eq(consultationRequests.leadId, leads.id))
    .orderBy(desc(consultationRequests.createdAt))
    .limit(100);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid_offline: "bg-green-100 text-green-700",
    requested: "bg-blue-100 text-blue-700",
    scheduled: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Consultations</h1>
        <span className="text-sm text-ink-400">{requests.length} requests</span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-ink-200/70 p-8 text-center text-ink-300">
          No consultation requests yet
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-ink-200/70 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold">{r.contactValue || "Unknown"}</div>
                  <div className="text-sm text-ink-400 mt-0.5">{r.siteAddress}</div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[r.paymentStatus] || "bg-ink-100 text-ink-400"}`}>
                    {r.paymentStatus === "paid_offline" ? "Paid" : "Pending Payment"}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[r.meetingStatus] || "bg-ink-100 text-ink-400"}`}>
                    {r.meetingStatus}
                  </span>
                </div>
              </div>

              {r.preferredDate && (
                <div className="text-sm text-ink-500 mb-2">
                  Preferred: {new Date(r.preferredDate).toLocaleDateString("en-JM", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}

              {r.notes && (
                <div className="text-sm text-ink-400 mb-3 bg-ink-50 rounded-lg p-3">
                  {r.notes}
                </div>
              )}

              <ConsultationActions
                id={r.id}
                paymentStatus={r.paymentStatus}
                meetingStatus={r.meetingStatus}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
