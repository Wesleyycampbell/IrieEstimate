import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  houseTypes,
  customizationCategories,
  customizationOptions,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/workspace-auth";
import { z } from "zod";

async function requireEditor() {
  const session = await getSession();
  if (!session || session.role === "viewer") return null;
  return session;
}

const patchHouseTypeSchema = z.object({
  table: z.literal("house_types"),
  id: z.string().uuid(),
  baseCostPerSqFt: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const patchOptionSchema = z.object({
  table: z.literal("customization_options"),
  id: z.string().uuid(),
  costModifier: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  name: z.string().min(1).optional(),
  modifierType: z.enum(["flat", "per_sq_ft", "percentage"]).optional(),
});

const patchSchema = z.union([patchHouseTypeSchema, patchOptionSchema]);

export async function PATCH(req: NextRequest) {
  if (!(await requireEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.table === "house_types") {
      const { table: _, id, ...fields } = data;
      const updates: Record<string, unknown> = {};
      if (fields.baseCostPerSqFt !== undefined) updates.baseCostPerSqFt = fields.baseCostPerSqFt;
      if (fields.isActive !== undefined) updates.isActive = fields.isActive;
      if (fields.name !== undefined) updates.name = fields.name;
      if (fields.description !== undefined) updates.description = fields.description;

      await db.update(houseTypes).set(updates).where(eq(houseTypes.id, id));
      return NextResponse.json({ ok: true });
    }

    if (data.table === "customization_options") {
      const { table: _, id, ...fields } = data;
      const updates: Record<string, unknown> = {};
      if (fields.costModifier !== undefined) updates.costModifier = fields.costModifier;
      if (fields.name !== undefined) updates.name = fields.name;
      if (fields.modifierType !== undefined) updates.modifierType = fields.modifierType;

      await db.update(customizationOptions).set(updates).where(eq(customizationOptions.id, id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  } catch (err) {
    console.error("Pricing update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createCategorySchema = z.object({
  action: z.literal("create_category"),
  name: z.string().min(1).max(100),
});

const createOptionSchema = z.object({
  action: z.literal("create_option"),
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  costModifier: z.string().regex(/^\d+(\.\d{1,2})?$/),
  modifierType: z.enum(["flat", "per_sq_ft", "percentage"]),
});

const postSchema = z.union([createCategorySchema, createOptionSchema]);

export async function POST(req: NextRequest) {
  if (!(await requireEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === "create_category") {
      const maxOrder = await db
        .select({ displayOrder: customizationCategories.displayOrder })
        .from(customizationCategories)
        .orderBy(asc(customizationCategories.displayOrder));

      const nextOrder = maxOrder.length > 0
        ? maxOrder[maxOrder.length - 1].displayOrder + 1
        : 1;

      const [cat] = await db
        .insert(customizationCategories)
        .values({ name: data.name, displayOrder: nextOrder })
        .returning();

      return NextResponse.json({ ok: true, id: cat.id });
    }

    if (data.action === "create_option") {
      const [opt] = await db
        .insert(customizationOptions)
        .values({
          categoryId: data.categoryId,
          name: data.name,
          costModifier: data.costModifier,
          modifierType: data.modifierType,
        })
        .returning();

      return NextResponse.json({ ok: true, id: opt.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Pricing create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const deleteCategorySchema = z.object({
  target: z.literal("category"),
  id: z.string().uuid(),
});

const deleteOptionSchema = z.object({
  target: z.literal("option"),
  id: z.string().uuid(),
});

const deleteSchema = z.union([deleteCategorySchema, deleteOptionSchema]);

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.target === "category") {
      await db.delete(customizationCategories).where(eq(customizationCategories.id, data.id));
      return NextResponse.json({ ok: true });
    }

    if (data.target === "option") {
      await db.delete(customizationOptions).where(eq(customizationOptions.id, data.id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  } catch (err) {
    console.error("Pricing delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
