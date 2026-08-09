import { db } from "@/db";
import { leads, consultationRequests, partners } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export default async function WorkspaceOverview() {
  const [leadCount] = await db.select({ value: count() }).from(leads);
  const [consultCount] = await db
    .select({ value: count() })
    .from(consultationRequests)
    .where(eq(consultationRequests.meetingStatus, "requested"));
  const [partnerCount] = await db.select({ value: count() }).from(partners);

  const stats = [
    { label: "Total Leads", value: leadCount.value },
    { label: "Pending Consultations", value: consultCount.value },
    { label: "Active Partners", value: partnerCount.value },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-ink-200/70 p-5"
          >
            <div className="text-3xl font-bold text-ink-800 tabular-nums">{s.value}</div>
            <div className="text-sm text-ink-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
