import "dotenv/config";
import postgres from "postgres";

async function cleanup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = postgres(url, { max: 1, ssl: "require" });

  // Delete old house types from the first migration (July 29 - Basic/Standard/Premium with wrong prices)
  const oldHouseTypes = [
    "91c1c213-fcc3-417f-b8b7-cb906547b742",
    "e94ca4a1-13fc-4d3a-afac-c8edcd17421d",
    "e1b53160-2dad-4905-808f-9449311b13f2",
  ];

  // Delete old categories from first migration (Roofing/Flooring/Kitchen/Bathroom)
  const oldCategories = [
    "c4207ca2-bd31-4de5-b7da-7a45f1200266",
    "a83c36d6-0c76-44f6-9812-d5b8964069a3",
    "f0e141e6-9c94-42d9-82fa-9d6e3b3857d8",
    "3514e684-efe5-4b37-a361-8d4631f5ba12",
  ];

  console.log("Deleting leads referencing old house types...");
  await sql`DELETE FROM lead_customizations WHERE lead_id IN (SELECT id FROM leads WHERE house_type_id = ANY(${oldHouseTypes}::uuid[]))`;
  await sql`DELETE FROM leads WHERE house_type_id = ANY(${oldHouseTypes}::uuid[])`;

  console.log("Deleting old customization options (cascades from categories)...");
  await sql`DELETE FROM customization_options WHERE category_id = ANY(${oldCategories}::uuid[])`;

  console.log("Deleting old categories...");
  await sql`DELETE FROM customization_categories WHERE id = ANY(${oldCategories}::uuid[])`;

  console.log("Deleting old house types...");
  await sql`DELETE FROM house_types WHERE id = ANY(${oldHouseTypes}::uuid[])`;

  console.log("Cleanup complete!");
  await sql.end();
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
