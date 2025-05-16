import { NextResponse } from "next/server";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { sql } from "drizzle-orm";
import { subDays, eachDayOfInterval, format } from "date-fns";

export const GET = withSuperAdminAuthRequired(async () => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const today = new Date();

    // Get all dates in the interval
    const dateRange = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: today,
    }).map(date => format(date, 'yyyy-MM-dd'));

    // Get actual signup counts
    const stats = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Create a map of date to count
    const countMap = new Map(stats.map(stat => [stat.date, Number(stat.count)]));

    // Fill in missing dates with zero counts
    const filledStats = dateRange.map(date => ({
      date,
      count: countMap.get(date) || 0,
    }));

    return NextResponse.json(filledStats);
  } catch (error) {
    console.error("Error fetching signup stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch signup stats" },
      { status: 500 }
    );
  }
}); 