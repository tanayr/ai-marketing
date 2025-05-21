import { NextResponse } from "next/server";
import { db } from "@/db";
import { templates } from "@/db/schema/templates";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { sql } from "drizzle-orm";

/**
 * GET /api/app/studio/retouchr/templates/categories
 * Fetch all available template categories
 */
async function GET() {
  try {
    // Get distinct categories from the database
    const categoriesResult = await db
      .select({
        category: templates.category
      })
      .from(templates)
      .where(
        sql`${templates.category} IS NOT NULL AND ${templates.category} != ''`
      )
      .groupBy(templates.category);

    const categories = categoriesResult
      .map(result => result.category)
      .filter(Boolean) as string[];

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching template categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch template categories" },
      { status: 500 }
    );
  }
}

export { GET };
