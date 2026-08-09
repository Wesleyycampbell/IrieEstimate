import LeadsClient from "./leads-client";

export default function LeadsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Leads</h1>
      </div>
      <LeadsClient />
    </div>
  );
}
