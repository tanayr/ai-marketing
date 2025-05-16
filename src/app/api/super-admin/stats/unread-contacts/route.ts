import { NextResponse } from "next/server";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { db } from "@/db";
import { contacts } from "@/db/schema/contact";
import { sql } from "drizzle-orm";

export const GET = withSuperAdminAuthRequired(async () => {
  try {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(contacts)
      .where(sql`${contacts.readAt} IS NULL`);

    return NextResponse.json({ count: Number(result[0].count) });
  } catch (error) {
    console.error("Error fetching unread contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread contacts" },
      { status: 500 }
    );
  }
}); 