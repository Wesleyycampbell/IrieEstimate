import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import postgres from "postgres";

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = postgres(url, { max: 1, ssl: "require" });

  console.log("Deleting old lead_customizations...");
  await sql`DELETE FROM lead_customizations`;

  console.log("Deleting old customization options...");
  await sql`DELETE FROM customization_options`;

  console.log("Deleting old customization categories...");
  await sql`DELETE FROM customization_categories`;

  console.log("Inserting new categories...");

  const cats = await sql`
    INSERT INTO customization_categories (name, display_order) VALUES
      ('Site Work & Foundation', 1),
      ('Block Work & Structure', 2),
      ('Roofing', 3),
      ('Wall & Ceiling Finishes', 4),
      ('Flooring', 5),
      ('Doors & Windows', 6),
      ('Kitchen', 7),
      ('Contingency', 8)
    RETURNING id, name
  `;

  const catMap: Record<string, string> = {};
  for (const c of cats) catMap[c.name] = c.id;

  console.log("Inserting options...");

  await sql`
    INSERT INTO customization_options (category_id, name, cost_modifier, modifier_type) VALUES
      -- Site Work & Foundation
      (${catMap["Site Work & Foundation"]}, 'Site Clearing Only', 0.00, 'flat'),
      (${catMap["Site Work & Foundation"]}, 'Strip Foundation', 0.00, 'per_sq_ft'),
      (${catMap["Site Work & Foundation"]}, 'Raft Foundation', 350.00, 'per_sq_ft'),
      (${catMap["Site Work & Foundation"]}, 'Pile Foundation (hilly terrain)', 800.00, 'per_sq_ft'),

      -- Block Work & Structure
      (${catMap["Block Work & Structure"]}, 'Standard 6" Block', 0.00, 'per_sq_ft'),
      (${catMap["Block Work & Structure"]}, 'Reinforced 6" Block', 250.00, 'per_sq_ft'),
      (${catMap["Block Work & Structure"]}, '8" Block (two-storey)', 450.00, 'per_sq_ft'),
      (${catMap["Block Work & Structure"]}, 'Concrete Frame + Infill', 700.00, 'per_sq_ft'),

      -- Roofing
      (${catMap["Roofing"]}, 'Zinc Sheet', 0.00, 'per_sq_ft'),
      (${catMap["Roofing"]}, 'Zinc + Sarking', 350.00, 'per_sq_ft'),
      (${catMap["Roofing"]}, 'Shingle Roof', 800.00, 'per_sq_ft'),
      (${catMap["Roofing"]}, 'Concrete Roof Deck', 1200.00, 'per_sq_ft'),

      -- Wall & Ceiling Finishes
      (${catMap["Wall & Ceiling Finishes"]}, 'Rough Render', 0.00, 'per_sq_ft'),
      (${catMap["Wall & Ceiling Finishes"]}, 'Smooth Render', 200.00, 'per_sq_ft'),
      (${catMap["Wall & Ceiling Finishes"]}, 'Surecote / Textured Finish', 450.00, 'per_sq_ft'),
      (${catMap["Wall & Ceiling Finishes"]}, 'Ceiling: PVC Panels', 150.00, 'per_sq_ft'),
      (${catMap["Wall & Ceiling Finishes"]}, 'Ceiling: Gypsum Board', 350.00, 'per_sq_ft'),

      -- Flooring
      (${catMap["Flooring"]}, 'Standard Ceramic Tiles', 0.00, 'per_sq_ft'),
      (${catMap["Flooring"]}, 'Porcelain Tiles', 300.00, 'per_sq_ft'),
      (${catMap["Flooring"]}, 'Premium Tiles', 500.00, 'per_sq_ft'),
      (${catMap["Flooring"]}, 'Stone Pavers / Marble', 900.00, 'per_sq_ft'),

      -- Doors & Windows
      (${catMap["Doors & Windows"]}, 'Standard Wooden Doors + Louver Windows', 0.00, 'flat'),
      (${catMap["Doors & Windows"]}, 'Upgraded: Panel Doors + Sliding Windows', 250000.00, 'flat'),
      (${catMap["Doors & Windows"]}, 'Premium: French Doors + Impact Windows', 600000.00, 'flat'),
      (${catMap["Doors & Windows"]}, 'Hurricane-Rated (full house)', 900000.00, 'flat'),

      -- Kitchen
      (${catMap["Kitchen"]}, 'Basic Countertop + Sink', 0.00, 'flat'),
      (${catMap["Kitchen"]}, 'Standard Cabinetry + Countertop', 350000.00, 'flat'),
      (${catMap["Kitchen"]}, 'Custom Cabinetry + Granite', 750000.00, 'flat'),
      (${catMap["Kitchen"]}, 'Full Fit-Out (appliances included)', 1500000.00, 'flat'),

      -- Contingency
      (${catMap["Contingency"]}, 'No Contingency (0%)', 0.00, 'percentage'),
      (${catMap["Contingency"]}, 'Minimal (10%)', 10.00, 'percentage'),
      (${catMap["Contingency"]}, 'Recommended (15%)', 15.00, 'percentage'),
      (${catMap["Contingency"]}, 'Conservative (20%)', 20.00, 'percentage')
  `;

  console.log("Migration complete! New categories:");
  for (const [name, id] of Object.entries(catMap)) {
    console.log(`  ${name} → ${id}`);
  }

  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
