"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HouseType {
  id: string;
  name: string;
  description: string | null;
  baseCostPerSqFt: string;
  isActive: boolean;
}

interface Option {
  id: string;
  name: string;
  costModifier: string;
  modifierType: string;
}

interface Category {
  id: string;
  name: string;
  options: Option[];
}

export default function PricingClient({
  houseTypes,
  categories,
}: {
  houseTypes: HouseType[];
  categories: Category[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingOptionTo, setAddingOptionTo] = useState<string | null>(null);
  const [newOpt, setNewOpt] = useState({ name: "", costModifier: "0.00", modifierType: "flat" });

  async function pricingFetch(method: string, body: object) {
    setSaving(true);
    try {
      const res = await fetch("/api/workspace/pricing", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Operation failed");
      }
    } finally {
      setSaving(false);
      router.refresh();
    }
  }

  async function createCategory() {
    if (!newCatName.trim()) return;
    await pricingFetch("POST", { action: "create_category", name: newCatName.trim() });
    setNewCatName("");
    setShowNewCategory(false);
  }

  async function createOption(categoryId: string) {
    if (!newOpt.name.trim()) return;
    await pricingFetch("POST", {
      action: "create_option",
      categoryId,
      name: newOpt.name.trim(),
      costModifier: newOpt.costModifier,
      modifierType: newOpt.modifierType,
    });
    setNewOpt({ name: "", costModifier: "0.00", modifierType: "flat" });
    setAddingOptionTo(null);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its options?")) return;
    await pricingFetch("DELETE", { target: "category", id });
  }

  async function deleteOption(id: string) {
    if (!confirm("Delete this option?")) return;
    await pricingFetch("DELETE", { target: "option", id });
  }

  async function updateHouseType(id: string, field: string, value: string | boolean) {
    await pricingFetch("PATCH", { table: "house_types", id, [field]: value });
  }

  async function updateOption(id: string, field: string, value: string) {
    await pricingFetch("PATCH", { table: "customization_options", id, [field]: value });
  }

  return (
    <div className="space-y-8">
      {saving && (
        <div className="fixed top-4 right-4 bg-ink-800 text-cane-400 px-4 py-2 rounded-lg text-sm font-semibold z-50">
          Saving...
        </div>
      )}

      {/* House Types */}
      <section>
        <h2 className="font-bold text-lg mb-4">House Types</h2>
        <div className="bg-white rounded-lg border border-ink-200/70 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 bg-ink-50">
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Base Cost/sqft</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Active</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {houseTypes.map((ht) => (
                <tr key={ht.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{ht.name}</td>
                  <td className="px-4 py-3">
                    {editing === ht.id ? (
                      <input
                        type="number"
                        defaultValue={ht.baseCostPerSqFt}
                        className="border border-ink-200 rounded px-2 py-1 w-28 text-sm"
                        onBlur={(e) => {
                          updateHouseType(ht.id, "baseCostPerSqFt", e.target.value);
                          setEditing(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateHouseType(ht.id, "baseCostPerSqFt", (e.target as HTMLInputElement).value);
                            setEditing(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-cane-600 transition"
                        onClick={() => setEditing(ht.id)}
                      >
                        JMD ${Number(ht.baseCostPerSqFt).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateHouseType(ht.id, "isActive", !ht.isActive)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        ht.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-ink-100 text-ink-400"
                      }`}
                    >
                      {ht.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(editing === ht.id ? null : ht.id)}
                      className="text-xs font-semibold text-cane-600 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customization Categories */}
      {categories.map((cat) => (
        <section key={cat.id}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">{cat.name}</h2>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
            >
              Remove category
            </button>
          </div>
          <div className="bg-white rounded-lg border border-ink-200/70 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200/70 bg-ink-50">
                  <th className="text-left px-4 py-3 font-semibold text-ink-500 w-10">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-500">Option</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-500">Modifier</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-500">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cat.options.map((opt, idx) => (
                  <tr key={opt.id} className="border-b border-ink-100 last:border-0">
                    <td className="px-4 py-3 text-ink-300 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {editing === opt.id && editField === "name" ? (
                        <input
                          type="text"
                          defaultValue={opt.name}
                          className="border border-ink-200 rounded px-2 py-1 w-full text-sm"
                          onBlur={(e) => {
                            if (e.target.value.trim() && e.target.value !== opt.name) {
                              updateOption(opt.id, "name", e.target.value.trim());
                            }
                            setEditing(null);
                            setEditField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && val !== opt.name) updateOption(opt.id, "name", val);
                              setEditing(null);
                              setEditField(null);
                            }
                            if (e.key === "Escape") { setEditing(null); setEditField(null); }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-cane-600 transition"
                          onClick={() => { setEditing(opt.id); setEditField("name"); }}
                        >
                          {opt.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === opt.id && editField === "costModifier" ? (
                        <input
                          type="number"
                          defaultValue={opt.costModifier}
                          className="border border-ink-200 rounded px-2 py-1 w-28 text-sm"
                          onBlur={(e) => {
                            if (e.target.value !== opt.costModifier) {
                              updateOption(opt.id, "costModifier", e.target.value);
                            }
                            setEditing(null);
                            setEditField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value;
                              if (val !== opt.costModifier) updateOption(opt.id, "costModifier", val);
                              setEditing(null);
                              setEditField(null);
                            }
                            if (e.key === "Escape") { setEditing(null); setEditField(null); }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-cane-600 transition"
                          onClick={() => { setEditing(opt.id); setEditField("costModifier"); }}
                        >
                          {opt.modifierType === "percentage"
                            ? `${opt.costModifier}%`
                            : `JMD $${Number(opt.costModifier).toLocaleString()}`}
                          {opt.modifierType === "per_sq_ft" && "/sqft"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === opt.id && editField === "modifierType" ? (
                        <select
                          defaultValue={opt.modifierType}
                          className="border border-ink-200 rounded px-2 py-1 text-sm"
                          onChange={(e) => {
                            updateOption(opt.id, "modifierType", e.target.value);
                            setEditing(null);
                            setEditField(null);
                          }}
                          onBlur={() => { setEditing(null); setEditField(null); }}
                          autoFocus
                        >
                          <option value="flat">flat</option>
                          <option value="per_sq_ft">per_sq_ft</option>
                          <option value="percentage">percentage</option>
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer text-ink-400 hover:text-cane-600 transition"
                          onClick={() => { setEditing(opt.id); setEditField("modifierType"); }}
                        >
                          {opt.modifierType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <button
                        onClick={() => deleteOption(opt.id)}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Add Option Row */}
                {addingOptionTo === cat.id ? (
                  <tr className="border-t border-ink-200/70 bg-ink-50/50">
                    <td className="px-4 py-3 text-ink-300">{cat.options.length + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Option name"
                        value={newOpt.name}
                        onChange={(e) => setNewOpt({ ...newOpt, name: e.target.value })}
                        className="border border-ink-200 rounded px-2 py-1 w-full text-sm"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newOpt.costModifier}
                        onChange={(e) => setNewOpt({ ...newOpt, costModifier: e.target.value })}
                        className="border border-ink-200 rounded px-2 py-1 w-28 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={newOpt.modifierType}
                        onChange={(e) => setNewOpt({ ...newOpt, modifierType: e.target.value })}
                        className="border border-ink-200 rounded px-2 py-1 text-sm"
                      >
                        <option value="flat">Flat</option>
                        <option value="per_sq_ft">Per sq ft</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        onClick={() => createOption(cat.id)}
                        className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg hover:bg-green-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setAddingOptionTo(null);
                          setNewOpt({ name: "", costModifier: "0.00", modifierType: "flat" });
                        }}
                        className="text-xs font-semibold text-ink-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr className="border-t border-ink-100">
                    <td colSpan={5} className="px-4 py-2">
                      <button
                        onClick={() => {
                          setAddingOptionTo(cat.id);
                          setNewOpt({ name: "", costModifier: "0.00", modifierType: "flat" });
                        }}
                        className="text-xs font-semibold text-ink-400 hover:text-ink-600"
                      >
                        + Add option
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* New Category */}
      {showNewCategory ? (
        <div className="bg-white rounded-lg border border-ink-200/70 p-5">
          <h3 className="font-bold text-sm mb-3">New Category</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="border-2 border-ink-200/70 rounded-lg px-3 py-2 text-sm flex-1"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") createCategory(); }}
            />
            <button
              onClick={createCategory}
              className="px-5 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900"
            >
              Create
            </button>
            <button
              onClick={() => { setShowNewCategory(false); setNewCatName(""); }}
              className="px-4 py-2 text-sm font-semibold text-ink-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewCategory(true)}
          className="w-full py-3 rounded-lg border-2 border-dashed border-ink-300 text-ink-400 text-sm font-semibold hover:border-ink-400 hover:text-ink-600 transition"
        >
          + Add new category
        </button>
      )}
    </div>
  );
}
