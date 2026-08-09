import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function migrate() {
  console.log("Running ads v2 migration...");

  // Add ad_type column
  await sql`
    ALTER TABLE ads ADD COLUMN IF NOT EXISTS ad_type text NOT NULL DEFAULT 'local'
  `;
  console.log("Added ad_type column");

  // Add sponsor_parish_ids array column
  await sql`
    ALTER TABLE ads ADD COLUMN IF NOT EXISTS sponsor_parish_ids text[] NOT NULL DEFAULT '{}'
  `;
  console.log("Added sponsor_parish_ids column");

  // Migrate existing sponsor_parish_id data to sponsor_parish_ids array
  await sql`
    UPDATE ads
    SET sponsor_parish_ids = ARRAY[sponsor_parish_id::text]
    WHERE sponsor_parish_id IS NOT NULL
      AND (sponsor_parish_ids IS NULL OR sponsor_parish_ids = '{}')
  `;
  console.log("Migrated existing parish data to array");

  // Drop old FK index and column
  await sql`DROP INDEX IF EXISTS idx_ads_parish`;
  await sql`ALTER TABLE ads DROP COLUMN IF EXISTS sponsor_parish_id`;
  console.log("Dropped old sponsor_parish_id column");

  // Add ad_type index
  await sql`CREATE INDEX IF NOT EXISTS idx_ads_type ON ads (ad_type)`;
  console.log("Created idx_ads_type index");

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
