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
  console.log("Creating blog_posts table...");
  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      slug text NOT NULL UNIQUE,
      excerpt text,
      content text NOT NULL,
      cover_image text,
      is_published boolean NOT NULL DEFAULT false,
      published_at timestamptz,
      author_email text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ blog_posts table created");

  try {
    await sql`CREATE INDEX idx_blog_slug ON blog_posts(slug)`;
    await sql`CREATE INDEX idx_blog_published ON blog_posts(is_published, published_at DESC)`;
    console.log("✓ indexes created");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) console.log("⊘ indexes already exist");
    else throw err;
  }

  // Seed a sample post
  await sql`
    INSERT INTO blog_posts (title, slug, excerpt, content, is_published, published_at, author_email)
    VALUES (
      'Understanding Jamaica Construction Costs in 2026',
      'understanding-jamaica-construction-costs-2026',
      'A breakdown of what it really costs to build a house in Jamaica this year — from foundation to finishing.',
      E'## What Does It Cost to Build in Jamaica?\n\nBuilding a house in Jamaica in 2026 involves careful budgeting across multiple trades. Labour costs vary significantly depending on the parish, the complexity of the build, and the quality of finishes you choose.\n\n### The Big Cost Drivers\n\n**Foundation** — This is where many first-time builders get surprised. A simple strip foundation on flat land might run J$350/sqft in labour, but if you''re building on a hillside in Portland, pile foundations can push that to J$900/sqft or more.\n\n**Block Work** — Standard 6-inch block construction is the baseline, but two-storey builds require 8-inch block with reinforced columns, adding roughly J$450/sqft to your labour bill.\n\n**Roofing** — Zinc sheet with framing is the most affordable option. Adding sarking (the underlayment beneath the zinc) costs an extra J$350/sqft but significantly improves insulation and weather resistance.\n\n### Regional Differences\n\nConstruction costs aren''t uniform across Jamaica. Kingston and St. Andrew benefit from proximity to suppliers and a larger labour pool. Remote parishes like Portland and Hanover can see costs 5-8% higher due to transport and limited tradesman availability.\n\n### Getting an Accurate Estimate\n\nThe best way to budget is to use a detailed estimate tool that accounts for your specific choices — house type, finishes, location — and gives you a realistic labour cost before you engage a contractor.\n\n[Get your free estimate →](/estimate)',
      true,
      now(),
      'admin@irieestimate.com'
    )
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log("✓ sample post seeded");

  const count = await sql`SELECT count(*) FROM blog_posts`;
  console.log(`\n${count[0].count} blog post(s) in database.`);

  await sql.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
