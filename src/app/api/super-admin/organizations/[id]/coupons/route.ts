import { NextResponse } from "next/server";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { db } from "@/db";
import { coupons } from "@/db/schema/coupons";
import { eq, and, isNotNull, desc } from "drizzle-orm";

export const GET = withSuperAdminAuthRequired(async (req, context) => {
  try {
    const id = (await context.params).id as string;
    if (!id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get all redeemed coupons for this organization
    const redeemedCoupons = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.organizationId, id),
          isNotNull(coupons.usedAt)
        )
      )
      .orderBy(desc(coupons.usedAt));

    return NextResponse.json(redeemedCoupons);
  } catch (error) {
    console.error("Error fetching redeemed coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch redeemed coupons" },
      { status: 500 }
    );
  }
}); 