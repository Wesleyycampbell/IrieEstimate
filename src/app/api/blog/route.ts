import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  try {
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        coverImage: blogPosts.coverImage,
        publishedAt: blogPosts.publishedAt,
        authorEmail: blogPosts.authorEmail,
      })
      .from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true)))
      .orderBy(desc(blogPosts.publishedAt));

    return NextResponse.json(
      { posts },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (err) {
    console.error("Blog API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
