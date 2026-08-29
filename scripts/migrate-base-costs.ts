import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function main() {
  console.log("Updating base options to show real labor costs...\n");

  // 1. Update base options that currently have $0 to show actual labor costs
  const updates = [
    { name: "Lineout & Excavation (basic)", cost: "200.00", type: "per_sq_ft" },
    { name: "6-inch Block (standard)", cost: "800.00", type: "per_sq_ft" },
    { name: "Zinc Sheet (framing only - no sarking)", cost: "500.00", type: "per_sq_ft" },
    { name: "Rough Render (wall & ceiling)", cost: "300.00", type: "per_sq_ft" },
    { name: "Standard Ceramic Tiles ($350/sqft)", cost: "350.00", type: "per_sq_ft" },
    { name: "Standard Doors + Louver Windows", cost: "150000.00", type: "flat" },
    { name: "Basic Kitchen (countertop $4K/ft)", cost: "120000.00", type: "flat" },
  ];

  // Total per_sq_ft being extracted: 200 + 800 + 500 + 300 + 350 = 2150
  const extractedPerSqFt = 2150;

  for (const u of updates) {
    const result = await sql`
      UPDATE customization_options
      SET cost_modifier = ${u.cost}, updated_at = NOW()
      WHERE name = ${u.name} AND cost_modifier = '0.00'
    `;
    console.log(`  ${u.name}: set to $${u.cost} (${u.type}) — ${result.count} row(s)`);
  }

  // 2. Reduce house type base costs by the extracted per_sq_ft amount
  console.log(`\nReducing all house type base costs by $${extractedPerSqFt}/sqft...\n`);

  const houseTypes = await sql`SELECT id, name, base_cost_per_sq_ft FROM house_types WHERE is_active = true`;
  for (const ht of houseTypes) {
    const oldCost = Number(ht.base_cost_per_sq_ft);
    const newCost = oldCost - extractedPerSqFt;
    await sql`
      UPDATE house_types
      SET base_cost_per_sq_ft = ${newCost.toFixed(2)}, updated_at = NOW()
      WHERE id = ${ht.id}
    `;
    console.log(`  ${ht.name}: $${oldCost.toLocaleString()} → $${newCost.toLocaleString()}/sqft`);
  }

  // 3. Verify — show all options with their costs
  console.log("\n--- All options with costs ---\n");
  const all = await sql`
    SELECT c.name as cat, o.name, o.cost_modifier, o.modifier_type
    FROM customization_options o
    JOIN customization_categories c ON o.category_id = c.id
    ORDER BY c.display_order, o.cost_modifier::numeric
  `;
  for (const r of all) {
    const cost = Number(r.cost_modifier);
    const label = r.modifier_type === "percentage" ? `${cost}%` :
      r.modifier_type === "per_sq_ft" ? `$${cost.toLocaleString()}/sqft` :
      `$${cost.toLocaleString()} flat`;
    console.log(`  ${r.cat} | ${r.name} | ${label}`);
  }

  console.log("\nDone.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
