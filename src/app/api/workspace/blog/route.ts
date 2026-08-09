import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/workspace-auth";
import { z } from "zod";

async function requireEditor() {
  const session = await getSession();
  if (!session || session.role === "viewer") return null;
  return session;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const posts = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));

  return NextResponse.json({ posts });
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireEditor();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const [post] = await db
      .insert(blogPosts)
      .values({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        coverImage: data.coverImage || null,
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? new Date() : null,
        authorEmail: session.email,
      })
      .returning();

    return NextResponse.json({ ok: true, id: post.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "A post with that slug already exists" }, { status: 409 });
    }
    console.error("Blog create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await requireEditor();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...fields } = parsed.data;
    const updates: Record<string, unknown> = {};
    if (fields.title !== undefined) updates.title = fields.title;
    if (fields.slug !== undefined) updates.slug = fields.slug;
    if (fields.excerpt !== undefined) updates.excerpt = fields.excerpt || null;
    if (fields.content !== undefined) updates.content = fields.content;
    if (fields.coverImage !== undefined) updates.coverImage = fields.coverImage || null;
    if (fields.isPublished !== undefined) {
      updates.isPublished = fields.isPublished;
      if (fields.isPublished) {
        const [existing] = await db.select({ publishedAt: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.id, id));
        if (!existing?.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
    }

    await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "A post with that slug already exists" }, { status: 409 });
    }
    console.error("Blog update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, parsed.data.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Blog delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
