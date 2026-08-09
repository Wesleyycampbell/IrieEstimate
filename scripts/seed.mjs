import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env"), "utf8");
const match = env.match(/DATABASE_URL=(.+)/);
if (!match) {
  throw new Error("DATABASE_URL not found in .env");
}
const url = match[1].trim();
const sql = postgres(url, { max: 1, ssl: "require" });

async function main() {
  const houseTypes = await sql`
    insert into house_types (name, description, base_cost_per_sq_ft)
    values
      ('Basic', 'Standard concrete block construction with essential finishes.', 12000),
      ('Standard', 'Quality finishes with upgraded fixtures and materials.', 18000),
      ('Premium', 'High-end finishes, custom design, and premium materials.', 26000)
    returning id, name
  `;
  console.log("Inserted house types:", houseTypes.map((h) => h.name));

  const categories = await sql`
    insert into customization_categories (name, display_order)
    values
      ('Roofing', 1),
      ('Flooring', 2),
      ('Kitchen', 3),
      ('Bathroom', 4)
    returning id, name
  `;
  console.log("Inserted categories:", categories.map((c) => c.name));

  const catByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  const options = [
    { category: "Roofing", name: "Zinc Roofing", costModifier: 0, modifierType: "flat" },
    { category: "Roofing", name: "Shingle Roofing", costModifier: 350, modifierType: "per_sq_ft" },
    { category: "Roofing", name: "Concrete Roof Deck", costModifier: 15, modifierType: "percentage" },
    { category: "Flooring", name: "Ceramic Tile", costModifier: 0, modifierType: "flat" },
    { category: "Flooring", name: "Porcelain Tile", costModifier: 250, modifierType: "per_sq_ft" },
    { category: "Flooring", name: "Hardwood Flooring", costModifier: 8, modifierType: "percentage" },
    { category: "Kitchen", name: "Standard Cabinetry", costModifier: 0, modifierType: "flat" },
    { category: "Kitchen", name: "Custom Cabinetry", costModifier: 250000, modifierType: "flat" },
    { category: "Kitchen", name: "Granite Countertops", costModifier: 180000, modifierType: "flat" },
    { category: "Bathroom", name: "Standard Fixtures", costModifier: 0, modifierType: "flat" },
    { category: "Bathroom", name: "Upgraded Fixtures", costModifier: 120000, modifierType: "flat" },
  ];

  for (const opt of options) {
    await sql`
      insert into customization_options (category_id, name, cost_modifier, modifier_type)
      values (${catByName[opt.category]}, ${opt.name}, ${opt.costModifier}, ${opt.modifierType})
    `;
  }
  console.log(`Inserted ${options.length} customization options.`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
