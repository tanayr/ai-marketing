import { NextResponse } from "next/server";
import { db } from "@/db";
import { creativeInspirations } from "@/db/schema/creative-inspirations";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { OrganizationRole } from "@/db/schema/organization";

/**
 * GET handler for fetching all creative inspirations
 * Accessible by any member of the organization
 */
export const GET = withOrganizationAuthRequired(async (req) => {
  try {
    // Fetch all creative inspirations
    const inspirations = await db
      .select()
      .from(creativeInspirations)
      .orderBy(creativeInspirations.name);
    
    return NextResponse.json(inspirations);
  } catch (error) {
    console.error("Error fetching creative inspirations:", error);
    return NextResponse.json(
      { error: "Failed to fetch creative inspirations" }, 
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
