import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function migrate() {
  console.log("Creating estimate_shares table...");
  await sql`
    CREATE TABLE IF NOT EXISTS estimate_shares (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token TEXT NOT NULL UNIQUE,
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      estimate_data TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_estimate_shares_token ON estimate_shares(token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_estimate_shares_expires ON estimate_shares(expires_at)`;

  console.log("Creating workspace_settings table...");
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Seed default settings
  await sql`
    INSERT INTO workspace_settings (key, value) VALUES ('pdf_download_enabled', 'true')
    ON CONFLICT (key) DO NOTHING
  `;

  console.log("Done.");
  await sql.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
