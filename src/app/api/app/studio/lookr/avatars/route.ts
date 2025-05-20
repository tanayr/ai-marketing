import { NextResponse } from "next/server";
import { db } from "@/db";
import { avatars } from "@/db/schema/avatars";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

// Validation schema for creating/updating an avatar
const avatarSchema = z.object({
  name: z.string().min(1, "Avatar name is required"),
  imageUrl: z.string().url("Must be a valid URL"),
  examples: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional(),
  isCommon: z.boolean().optional(),
});

// Create a new avatar
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    // Parse and validate request body
    const body = await req.json();
    const validData = avatarSchema.parse(body);
    
    // Check if trying to create a common avatar
    const isCommon = validData.isCommon === true;
    
    // For common avatars, check if user is a super admin
    if (isCommon) {
      const email = user.email;
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super administrators can create common avatars" },
          { status: 403 }
        );
      }
    }
    
    // Create new avatar
    const newAvatar = await db.insert(avatars).values({
      name: validData.name,
      imageUrl: validData.imageUrl,
      examples: validData.examples || [],
      metadata: validData.metadata || {},
      isCommon: isCommon,
      // Only set organizationId for organization-specific avatars
      organizationId: isCommon ? null : organization.id,
      createdById: user.id,
    }).returning();
    
    return NextResponse.json(newAvatar[0]);
  } catch (error) {
    console.error("Error creating avatar:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create avatar" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can create avatars

// Get all avatars for the current organization
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    
    // Get all avatars for this organization plus common avatars
    const organizationAvatars = await db
      .select()
      .from(avatars)
      .where(
        // Either organization-specific avatars OR common avatars
        // Using SQL OR operator with conditions
        sql`${avatars.organizationId} = ${organization.id} OR ${avatars.isCommon} = true`
      )
      .orderBy(avatars.name);
    
    return NextResponse.json(organizationAvatars);
  } catch (error) {
    console.error("Error fetching avatars:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatars" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can view avatars
