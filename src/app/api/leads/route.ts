import { NextResponse } from "next/server";
import { db } from "@/db";
import { houseTypes, customizationCategories, customizationOptions, parishes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const types = await db
      .select()
      .from(houseTypes)
      .where(eq(houseTypes.isActive, true));

    const categories = await db
      .select()
      .from(customizationCategories)
      .orderBy(asc(customizationCategories.displayOrder));

    const options = await db.select().from(customizationOptions);

    const allParishes = await db
      .select({ id: parishes.id, name: parishes.name, costMultiplier: parishes.costMultiplier })
      .from(parishes)
      .orderBy(asc(parishes.name));

    const categoriesWithOptions = categories.map((cat) => ({
      ...cat,
      options: options.filter((opt) => opt.categoryId === cat.id),
    }));

    return NextResponse.json(
      { houseTypes: types, categories: categoriesWithOptions, parishes: allParishes },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("Pricing API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
