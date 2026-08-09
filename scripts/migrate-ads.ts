import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });

async function migrate() {
  console.log("Creating ads table...");
  await sql`
    CREATE TABLE IF NOT EXISTS ads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_url TEXT,
      target_pages TEXT[] NOT NULL DEFAULT '{}',
      sponsor_parish_id UUID REFERENCES parishes(id),
      sponsor_name TEXT,
      start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_date TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT true,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("Creating ads indexes...");
  await sql`CREATE INDEX IF NOT EXISTS idx_ads_active ON ads (is_active, start_date, end_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ads_parish ON ads (sponsor_parish_id)`;

  console.log("Adding IP tracking columns to leads...");
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ip_address TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS country TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_local BOOLEAN`;

  console.log("Migration complete.");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
