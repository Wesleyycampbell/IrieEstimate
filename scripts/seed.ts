import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import crypto from "crypto";

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      resolve(`${salt}:${derived.toString("hex")}`);
    });
  });
}

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = postgres(url, { max: 1, ssl: "require" });
  const db = drizzle(sql, { schema });

  console.log("Seeding house types...");
  await db.insert(schema.houseTypes).values([
    { name: "Affordable", description: "Budget-friendly construction with standard materials", baseCostPerSqFt: "4500.00", isActive: true },
    { name: "Standard", description: "Quality build with mid-range finishes", baseCostPerSqFt: "7000.00", isActive: true },
    { name: "Premium", description: "High-end construction with premium materials", baseCostPerSqFt: "10500.00", isActive: true },
    { name: "Luxury", description: "Top-tier build with luxury finishes throughout", baseCostPerSqFt: "15000.00", isActive: true },
  ]).onConflictDoNothing();

  console.log("Seeding customization categories...");
  const cats = await db.insert(schema.customizationCategories).values([
    { name: "Roof Type", displayOrder: 1 },
    { name: "Foundation", displayOrder: 2 },
    { name: "Wall Finish", displayOrder: 3 },
    { name: "Flooring", displayOrder: 4 },
    { name: "Fixtures", displayOrder: 5 },
  ]).onConflictDoNothing().returning();

  if (cats.length > 0) {
    const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]));

    console.log("Seeding customization options...");
    await db.insert(schema.customizationOptions).values([
      { categoryId: catMap["Roof Type"], name: "Zinc Sheet", costModifier: "0.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Roof Type"], name: "Zinc + Sarking", costModifier: "350.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Roof Type"], name: "Shingles", costModifier: "800.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Foundation"], name: "Standard Slab", costModifier: "0.00", modifierType: "flat" },
      { categoryId: catMap["Foundation"], name: "Raised Foundation", costModifier: "250000.00", modifierType: "flat" },
      { categoryId: catMap["Foundation"], name: "Pile Foundation (hilly)", costModifier: "500000.00", modifierType: "flat" },
      { categoryId: catMap["Wall Finish"], name: "Rough Render", costModifier: "0.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Wall Finish"], name: "Smooth Render", costModifier: "200.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Wall Finish"], name: "Surecote (Premium)", costModifier: "450.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Flooring"], name: "Standard Tiles", costModifier: "0.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Flooring"], name: "Premium Tiles", costModifier: "500.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Flooring"], name: "Stone Pavers", costModifier: "900.00", modifierType: "per_sq_ft" },
      { categoryId: catMap["Fixtures"], name: "Basic Package", costModifier: "0.00", modifierType: "flat" },
      { categoryId: catMap["Fixtures"], name: "Standard Package", costModifier: "350000.00", modifierType: "flat" },
      { categoryId: catMap["Fixtures"], name: "Premium Package", costModifier: "750000.00", modifierType: "flat" },
    ]).onConflictDoNothing();
  }

  console.log("Creating workspace admin user...");
  const hash = await hashPassword("admin123");
  await db.insert(schema.workspaceUsers).values({
    email: "admin@irieestimate.com",
    passwordHash: hash,
    role: "admin",
  }).onConflictDoNothing();

  console.log("Seed complete!");
  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
