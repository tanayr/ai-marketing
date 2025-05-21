import { NextResponse } from "next/server";
import { db } from "@/db";
import { templates } from "@/db/schema/templates";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

// Validation schema for creating/updating a template
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  width: z.string().min(1, "Width is required"),
  height: z.string().min(1, "Height is required"),
  templateContent: z.any().refine(val => val !== null && val !== undefined, "Template content is required"),
  thumbnailUrl: z.string().url().optional(),
  isCommon: z.boolean().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Create a new template
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    // Parse and validate request body
    const body = await req.json();
    const validData = templateSchema.parse(body);
    
    // Check if trying to create a common template
    const isCommon = validData.isCommon === true;
    
    // For common templates, check if user is a super admin
    if (isCommon) {
      const email = user.email;
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super administrators can create common templates" },
          { status: 403 }
        );
      }
    }
    
    // Create new template
    const newTemplate = await db.insert(templates).values({
      name: validData.name,
      description: validData.description || null,
      width: validData.width,
      height: validData.height,
      templateContent: validData.templateContent,
      thumbnailUrl: validData.thumbnailUrl || null,
      isCommon: isCommon,
      // Only set organizationId for organization-specific templates
      organizationId: isCommon ? null : organization.id,
      createdById: user.id,
      category: validData.category || null,
      tags: validData.tags || [],
    }).returning();
    
    return NextResponse.json(newTemplate[0]);
  } catch (error) {
    console.error("Error creating template:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can create templates

// Get all templates for the current organization (common + org-specific)
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    
    // Get all templates for this organization plus common templates
    const organizationTemplates = await db
      .select()
      .from(templates)
      .where(
        // Either organization-specific templates OR common templates
        // Using SQL OR operator with conditions
        sql`${templates.organizationId} = ${organization.id} OR ${templates.isCommon} = true`
      )
      .orderBy(templates.name);
    
    return NextResponse.json(organizationTemplates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can view templates
