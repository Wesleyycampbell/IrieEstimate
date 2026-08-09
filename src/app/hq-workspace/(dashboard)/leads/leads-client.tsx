"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  contactValue: string;
  contactType: string;
  houseTypeId: string;
  totalSquareFootage: number;
  parishId: string | null;
  finalEstimatedCost: string;
  consentToSharePartners: boolean;
  ipAddress: string | null;
  isLocal: boolean | null;
  createdAt: string;
  houseTypeName: string | null;
  parishName: string | null;
}

interface HouseType { id: string; name: string }
interface Parish { id: string; name: string }

type FilterOrigin = "all" | "local" | "intl" | "unknown";

export default function LeadsClient() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [houseTypeList, setHouseTypeList] = useState<HouseType[]>([]);
  const [parishList, setParishList] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterOrigin, setFilterOrigin] = useState<FilterOrigin>("all");
  const [filterHouseType, setFilterHouseType] = useState("");
  const [filterParish, setFilterParish] = useState("");

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editContact, setEditContact] = useState("");
  const [editContactType, setEditContactType] = useState("");
  const [editSqft, setEditSqft] = useState(0);
  const [editCost, setEditCost] = useState("");
  const [editParishId, setEditParishId] = useState("");
  const [editHouseTypeId, setEditHouseTypeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/leads");
      const data = await res.json();
      setAllLeads(data.leads || []);
      setHouseTypeList(data.houseTypes || []);
      setParishList(data.parishes || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLeads(); }, []);

  const filtered = allLeads.filter((l) => {
    if (filterOrigin === "local" && l.isLocal !== true) return false;
    if (filterOrigin === "intl" && l.isLocal !== false) return false;
    if (filterOrigin === "unknown" && l.isLocal !== null) return false;
    if (filterHouseType && l.houseTypeId !== filterHouseType) return false;
    if (filterParish && l.parishId !== filterParish) return false;
    return true;
  });

  const localCount = allLeads.filter((l) => l.isLocal === true).length;
  const intlCount = allLeads.filter((l) => l.isLocal === false).length;
  const unknownCount = allLeads.filter((l) => l.isLocal === null).length;

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setEditContact(lead.contactValue);
    setEditContactType(lead.contactType);
    setEditSqft(lead.totalSquareFootage);
    setEditCost(lead.finalEstimatedCost);
    setEditParishId(lead.parishId || "");
    setEditHouseTypeId(lead.houseTypeId);
    setError("");
  }

  async function handleSave() {
    if (!editingLead || !editContact.trim()) { setError("Contact is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/workspace/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLead.id,
          contactValue: editContact.trim(),
          contactType: editContactType,
          totalSquareFootage: editSqft,
          finalEstimatedCost: editCost,
          parishId: editParishId,
          houseTypeId: editHouseTypeId,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); return; }
      setEditingLead(null);
      await loadLeads();
    } catch { setError("Network error"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/workspace/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed"); return; }
      if (editingLead?.id === id) setEditingLead(null);
      await loadLeads();
    } catch { alert("Network error"); }
  }

  function downloadExcel() {
    const rows = filtered.map((l) => ({
      Contact: l.contactValue,
      "Contact Type": l.contactType,
      "House Type": l.houseTypeName || "",
      Parish: l.parishName || "",
      "Sq Ft": l.totalSquareFootage,
      "Estimate (JMD)": Number(l.finalEstimatedCost),
      Origin: l.isLocal === true ? "Local" : l.isLocal === false ? "International" : "Unknown",
      IP: l.ipAddress || "",
      Date: new Date(l.createdAt).toLocaleDateString("en-JM", { year: "numeric", month: "short", day: "numeric" }),
    }));

    if (rows.length === 0) { alert("No leads to export."); return; }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => {
          const val = String(r[h as keyof typeof r]);
          return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(",")
      ),
    ];
    const csv = "﻿" + csvLines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix = filterOrigin !== "all" ? `_${filterOrigin}` : "";
    a.download = `irieestimate_leads${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-JM", { year: "numeric", month: "short", day: "numeric" });

  const fmtCost = (c: string) => `JMD $${Number(c).toLocaleString()}`;

  if (loading) return <div className="text-ink-400 text-sm">Loading leads...</div>;

  // EDIT MODAL
  if (editingLead) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Edit Lead</h2>
          <button onClick={() => setEditingLead(null)} className="text-sm text-ink-400 hover:text-ink-600">Cancel</button>
        </div>
        <div className="bg-white rounded-lg border border-ink-200/70 p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Contact</label>
              <input type="text" value={editContact} onChange={(e) => setEditContact(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Contact Type</label>
              <select value={editContactType} onChange={(e) => setEditContactType(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none bg-white">
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">House Type</label>
              <select value={editHouseTypeId} onChange={(e) => setEditHouseTypeId(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none bg-white">
                {houseTypeList.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Parish</label>
              <select value={editParishId} onChange={(e) => setEditParishId(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none bg-white">
                <option value="">No parish</option>
                {parishList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Square Footage</label>
              <input type="number" value={editSqft} onChange={(e) => setEditSqft(parseInt(e.target.value) || 0)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Estimated Cost (JMD)</label>
              <input type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none" />
            </div>
          </div>
          <div className="text-xs text-ink-300 space-y-1">
            <div>IP: {editingLead.ipAddress || "—"} | Origin: {editingLead.isLocal === true ? "Local" : editingLead.isLocal === false ? "International" : "Unknown"}</div>
            <div>Created: {fmtDate(editingLead.createdAt)}</div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={() => setEditingLead(null)} className="px-5 py-2.5 text-sm font-semibold text-ink-400 hover:underline">Cancel</button>
          <button onClick={() => handleDelete(editingLead.id)}
            className="ml-auto px-5 py-2.5 text-sm font-semibold text-red-500 hover:text-red-700">Delete Lead</button>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <button onClick={() => setFilterOrigin(filterOrigin === "local" ? "all" : "local")}
          className={`bg-white rounded-lg border p-3 sm:p-4 text-left transition ${filterOrigin === "local" ? "border-green-400 ring-2 ring-green-100" : "border-ink-200/70"}`}>
          <div className="text-xl sm:text-2xl font-bold">{localCount}</div>
          <div className="text-[10px] sm:text-xs text-ink-400 font-semibold mt-1">Local (Jamaica)</div>
        </button>
        <button onClick={() => setFilterOrigin(filterOrigin === "intl" ? "all" : "intl")}
          className={`bg-white rounded-lg border p-3 sm:p-4 text-left transition ${filterOrigin === "intl" ? "border-blue-400 ring-2 ring-blue-100" : "border-ink-200/70"}`}>
          <div className="text-xl sm:text-2xl font-bold">{intlCount}</div>
          <div className="text-[10px] sm:text-xs text-ink-400 font-semibold mt-1">International</div>
        </button>
        <button onClick={() => setFilterOrigin(filterOrigin === "unknown" ? "all" : "unknown")}
          className={`bg-white rounded-lg border p-3 sm:p-4 text-left transition ${filterOrigin === "unknown" ? "border-ink-400 ring-2 ring-ink-100" : "border-ink-200/70"}`}>
          <div className="text-xl sm:text-2xl font-bold">{unknownCount}</div>
          <div className="text-[10px] sm:text-xs text-ink-400 font-semibold mt-1">Unknown</div>
        </button>
      </div>

      {/* Filters + export */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <select value={filterHouseType} onChange={(e) => setFilterHouseType(e.target.value)}
          className="border border-ink-200/70 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ink-300 outline-none">
          <option value="">All house types</option>
          {houseTypeList.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select value={filterParish} onChange={(e) => setFilterParish(e.target.value)}
          className="border border-ink-200/70 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ink-300 outline-none">
          <option value="">All parishes</option>
          {parishList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(filterOrigin !== "all" || filterHouseType || filterParish) && (
          <button onClick={() => { setFilterOrigin("all"); setFilterHouseType(""); setFilterParish(""); }}
            className="text-xs text-ink-400 hover:text-ink-600 font-semibold">
            Clear filters
          </button>
        )}
        <div className="sm:ml-auto flex items-center gap-3">
          <span className="text-sm text-ink-400">{filtered.length} of {allLeads.length} leads</span>
          <button onClick={downloadExcel}
            className="px-4 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900 transition flex items-center gap-1.5 shrink-0">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-ink-200/70 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200/70 bg-ink-50">
              <th className="text-left px-4 py-3 font-semibold text-ink-500">Contact</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">House Type</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">Parish</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">Sq Ft</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">Estimate</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">Origin</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">IP</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-500 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-ink-300">
                  {allLeads.length === 0 ? "No leads yet" : "No leads match the current filters"}
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium">{lead.contactValue}</td>
                  <td className="px-4 py-3 text-ink-400">{lead.contactType}</td>
                  <td className="px-4 py-3">{lead.houseTypeName || "—"}</td>
                  <td className="px-4 py-3 text-ink-400">{lead.parishName || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{lead.totalSquareFootage.toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">{fmtCost(lead.finalEstimatedCost)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      lead.isLocal === true ? "bg-green-100 text-green-700"
                        : lead.isLocal === false ? "bg-blue-100 text-blue-700"
                        : "bg-ink-100 text-ink-400"
                    }`}>
                      {lead.isLocal === true ? "Local" : lead.isLocal === false ? "Intl" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-300 text-xs font-mono">{lead.ipAddress || "—"}</td>
                  <td className="px-4 py-3 text-ink-400 whitespace-nowrap">{fmtDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(lead)} className="text-xs font-semibold text-cane-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(lead.id)} className="text-xs font-semibold text-red-500 hover:underline">Del</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-ink-200/70 p-6 text-center text-ink-300">
            {allLeads.length === 0 ? "No leads yet" : "No leads match the current filters"}
          </div>
        ) : (
          filtered.map((lead) => (
            <div key={lead.id} className="bg-white rounded-lg border border-ink-200/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm truncate flex-1">{lead.contactValue}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    lead.isLocal === true ? "bg-green-100 text-green-700"
                      : lead.isLocal === false ? "bg-blue-100 text-blue-700"
                      : "bg-ink-100 text-ink-400"
                  }`}>
                    {lead.isLocal === true ? "Local" : lead.isLocal === false ? "Intl" : "—"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-ink-400">
                <div><span className="font-semibold text-ink-500">Type:</span> {lead.houseTypeName || "—"}</div>
                <div><span className="font-semibold text-ink-500">Parish:</span> {lead.parishName || "—"}</div>
                <div><span className="font-semibold text-ink-500">Sq Ft:</span> {lead.totalSquareFootage.toLocaleString()}</div>
                <div className="font-semibold text-ink-700">{fmtCost(lead.finalEstimatedCost)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-ink-300">
                  <span className="font-mono">{lead.ipAddress || "no IP"}</span>
                  <span className="mx-1">·</span>
                  <span>{fmtDate(lead.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => openEdit(lead)} className="text-xs font-semibold text-cane-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(lead.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
