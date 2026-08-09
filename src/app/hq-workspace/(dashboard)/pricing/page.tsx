import { db } from "@/db";
import { houseTypes, customizationCategories, customizationOptions } from "@/db/schema";
import { asc } from "drizzle-orm";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const types = await db.select().from(houseTypes);
  const categories = await db
    .select()
    .from(customizationCategories)
    .orderBy(asc(customizationCategories.displayOrder));
  const options = await db.select().from(customizationOptions);

  const categoriesWithOptions = categories.map((cat) => ({
    ...cat,
    options: options.filter((o) => o.categoryId === cat.id),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pricing Engine</h1>
      <PricingClient houseTypes={types} categories={categoriesWithOptions} />
    </div>
  );
}
