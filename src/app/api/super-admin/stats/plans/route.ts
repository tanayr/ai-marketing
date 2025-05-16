import { NextResponse } from "next/server";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { plans } from "@/db/schema/plans";
import { sql } from "drizzle-orm";

export const GET = withSuperAdminAuthRequired(async () => {
  try {
    // Get counts for each plan
    const planStats = await db
      .select({
        planId: organizations.planId,
        planName: plans.name,
        count: sql<number>`COUNT(*)`,
      })
      .from(organizations)
      .leftJoin(plans, sql`${organizations.planId} = ${plans.id}`)
      .groupBy(organizations.planId, plans.name);

    // Get count of organizations with no plan
    const noPlanCount = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(organizations)
      .where(sql`${organizations.planId} IS NULL`)
      .then((res) => Number(res[0].count));

    // Format the response
    const stats = [
      ...planStats.map((stat) => ({
        id: stat.planId,
        name: stat.planName || "Unknown Plan",
        count: Number(stat.count),
      })),
      {
        id: "no-plan",
        name: "No Plan",
        count: noPlanCount,
      },
    ];

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching plan stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan stats" },
      { status: 500 }
    );
  }
}); 