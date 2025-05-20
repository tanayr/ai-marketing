import { NextResponse } from "next/server";
import { db } from "@/db";
import { avatars } from "@/db/schema/avatars";
import { eq, and, sql } from "drizzle-orm";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";

// Validation schema for updating an avatar
const avatarUpdateSchema = z.object({
  name: z.string().min(1, "Avatar name is required").optional(),
  imageUrl: z.string().url("Must be a valid URL").optional(),
  examples: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Get a single avatar by ID
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const id = params.id as string;
    
    // Find the avatar by ID and either belonging to the organization or is common
    const results = await db
      .select()
      .from(avatars)
      .where(
        and(
          eq(avatars.id, id),
          // Avatar must either belong to this organization OR be a common avatar
          sql`(${avatars.organizationId} = ${organization.id} OR ${avatars.isCommon} = true)`
        )
      )
      .limit(1);
    
    const avatar = results[0];
    
    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(avatar);
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatar" },
      { status: 500 }
    );
  }
}, "user");

// Update an avatar
export const PUT = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const id = params.id as string;
    
    // Parse and validate request body
    const body = await req.json();
    const validData = avatarUpdateSchema.parse(body);
    
    // Verify avatar exists and either belongs to organization or is common
    const existingResults = await db
      .select()
      .from(avatars)
      .where(
        and(
          eq(avatars.id, id),
          sql`(${avatars.organizationId} = ${organization.id} OR ${avatars.isCommon} = true)`
        )
      )
      .limit(1);
      
    const existingAvatar = existingResults[0];
    
    if (!existingAvatar) {
      return NextResponse.json(
        { error: "Avatar not found" },
        { status: 404 }
      );
    }
    
    // For common avatars, check if user is a super admin
    if (existingAvatar.isCommon) {
      const user = await context.session.user;
      const email = user.email;
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super administrators can modify common avatars" },
          { status: 403 }
        );
      }
    }
    
    // Update avatar
    const updatedAvatar = await db
      .update(avatars)
      .set({
        ...validData,
        updatedAt: new Date(),
      })
      .where(eq(avatars.id, id))
      .returning();
    
    return NextResponse.json(updatedAvatar[0]);
  } catch (error) {
    console.error("Error updating avatar:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}, "user");

// Delete an avatar
export const DELETE = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const id = params.id as string;
    
    // Verify avatar exists and either belongs to organization or is common
    const existingResults = await db
      .select()
      .from(avatars)
      .where(
        and(
          eq(avatars.id, id),
          sql`(${avatars.organizationId} = ${organization.id} OR ${avatars.isCommon} = true)`
        )
      )
      .limit(1);
      
    const existingAvatar = existingResults[0];
    
    if (!existingAvatar) {
      return NextResponse.json(
        { error: "Avatar not found" },
        { status: 404 }
      );
    }
    
    // For common avatars, check if user is a super admin
    if (existingAvatar.isCommon) {
      const user = await context.session.user;
      const email = user.email;
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super administrators can delete common avatars" },
          { status: 403 }
        );
      }
    }
    
    // Delete the avatar
    const deletedAvatar = await db
      .delete(avatars)
      .where(eq(avatars.id, id))
      .returning();
    
    // Convert to array if it's not already
    const deletedResults = Array.isArray(deletedAvatar) ? deletedAvatar : [deletedAvatar];
    
    if (deletedResults.length === 0) {
      return NextResponse.json(
        { error: "Avatar not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}, "admin"); // Only admins can delete avatars
