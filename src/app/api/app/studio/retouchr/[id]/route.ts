import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema/assets";
import { eq, and } from "drizzle-orm";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";

// Get a specific design
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const params = await context.params;
    const organization = await context.session.organization;
    
    const designId = params.id as string;
    
    // Get the design
    const designResults = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, designId),
          eq(assets.organizationId, organization.id)
        )
      );
    
    const design = designResults[0];
    
    if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(design);
  } catch (error) {
    console.error("Error fetching design:", error);
    return NextResponse.json(
      { error: "Failed to fetch design" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can view designs

// Delete a design
export const DELETE = withOrganizationAuthRequired(async (req, context) => {
  try {
    const params = await context.params;
    const organization = await context.session.organization;
    
    const designId = params.id as string;
    
    // Verify design exists and belongs to organization
    const designResults = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, designId),
          eq(assets.organizationId, organization.id)
        )
      );
    
    const design = designResults[0];
    
    if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }
    
    // Delete the design
    await db.delete(assets).where(eq(assets.id, designId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting design:", error);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can delete designs
