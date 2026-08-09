import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require" });

async function migrate() {
  // Step 1: Create parishes table
  console.log("Creating parishes table...");
  await sql`
    CREATE TABLE IF NOT EXISTS parishes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL UNIQUE,
      cost_multiplier numeric(5,3) NOT NULL DEFAULT 1.000
        CHECK (cost_multiplier > 0 AND cost_multiplier <= 3.000),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ parishes table created");

  // Step 2: Add parish_id to leads
  console.log("Adding parish_id to leads...");
  try {
    await sql`ALTER TABLE leads ADD COLUMN parish_id uuid REFERENCES parishes(id)`;
    console.log("✓ parish_id column added to leads");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      console.log("⊘ parish_id already exists on leads");
    } else throw err;
  }

  // Step 3: Add parishes_served to partners
  console.log("Adding parishes_served to partners...");
  try {
    await sql`ALTER TABLE partners ADD COLUMN parishes_served text[] DEFAULT '{}'`;
    console.log("✓ parishes_served column added to partners");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      console.log("⊘ parishes_served already exists on partners");
    } else throw err;
  }

  // Step 4: Create index
  try {
    await sql`CREATE INDEX idx_leads_parish ON leads(parish_id)`;
    console.log("✓ index created");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      console.log("⊘ index already exists");
    } else throw err;
  }

  // Step 5: Seed parishes
  console.log("Seeding parishes...");
  const parishData = [
    { name: "Kingston", multiplier: "1.000" },
    { name: "St. Andrew", multiplier: "1.000" },
    { name: "St. Thomas", multiplier: "1.050" },
    { name: "Portland", multiplier: "1.080" },
    { name: "St. Mary", multiplier: "1.060" },
    { name: "St. Ann", multiplier: "1.040" },
    { name: "Trelawny", multiplier: "1.060" },
    { name: "St. James", multiplier: "1.020" },
    { name: "Hanover", multiplier: "1.070" },
    { name: "Westmoreland", multiplier: "1.060" },
    { name: "St. Elizabeth", multiplier: "1.050" },
    { name: "Manchester", multiplier: "1.030" },
    { name: "Clarendon", multiplier: "1.030" },
    { name: "St. Catherine", multiplier: "1.010" },
  ];

  for (const p of parishData) {
    await sql`
      INSERT INTO parishes (name, cost_multiplier)
      VALUES (${p.name}, ${p.multiplier})
      ON CONFLICT (name) DO UPDATE SET cost_multiplier = ${p.multiplier}
    `;
  }
  console.log(`✓ ${parishData.length} parishes seeded`);

  // Verify
  const rows = await sql`SELECT name, cost_multiplier FROM parishes ORDER BY name`;
  console.log("\nParishes in database:");
  for (const r of rows) {
    console.log(`  ${r.name}: ${r.cost_multiplier}x`);
  }

  console.log("\nDone.");
  await sql.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
