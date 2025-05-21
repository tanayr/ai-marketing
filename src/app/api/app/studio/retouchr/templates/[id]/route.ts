import { NextResponse } from "next/server";
import { db } from "@/db";
import { templates } from "@/db/schema/templates";
import { eq, and, sql } from "drizzle-orm";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";

// Validation schema for updating a template
const templateUpdateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  description: z.string().optional(),
  width: z.string().min(1, "Width is required").optional(),
  height: z.string().min(1, "Height is required").optional(),
  templateContent: z.any().optional(),
  thumbnailUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Get a single template by ID
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const id = params.id as string;
    
    // Find the template by ID and either belonging to the organization or is common
    const results = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.id, id),
          // Template must either belong to this organization OR be a common template
          sql`(${templates.organizationId} = ${organization.id} OR ${templates.isCommon} = true)`
        )
      )
      .limit(1);
    
    const template = results[0];
    
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}, "user");

// Update a template
export const PUT = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const id = params.id as string;
    
    // Parse and validate request body
    const body = await req.json();
    const validData = templateUpdateSchema.parse(body);
    
    // Verify template exists and either belongs to organization or is common
    const existingResults = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.id, id),
          sql`(${templates.organizationId} = ${organization.id} OR ${templates.isCommon} = true)`
        )
      )
      .limit(1);
      
    const existingTemplate = existingResults[0];
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    
    // For common templates, check if user is a super admin
    if (existingTemplate.isCommon) {
      const user = await context.session.user;
      const email = user.email;
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super administrators can modify common templates" },
          { status: 403 }
        );
      }
    }
    
    // Update template
    const updatedTemplate = await db
      .update(templates)
      .set({
        ...validData,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, id))
      .returning();
    
    return NextResponse.json(updatedTemplate[0]);
  } catch (error) {
    console.error("Error updating template:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}, "user");

// Delete a template
export const DELETE = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const id = params.id as string;
    
    // Verify template exists and either belongs to organization or is common
    const existingResults = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.id, id),
          sql`(${templates.organizationId} = ${organization.id} OR ${templates.isCommon} = true)`
        )
      )
      .limit(1);
      
    const existingTemplate = existingResults[0];
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    
    // For common templates, check if user is a super admin
    if (existingTemplate.isCommon) {
      const user = await context.session.user;
      const email = user.email;
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super administrators can delete common templates" },
          { status: 403 }
        );
      }
    }
    
    // Delete the template
    const deletedTemplate = await db
      .delete(templates)
      .where(eq(templates.id, id))
      .returning();
    
    // Convert to array if it's not already
    const deletedResults = Array.isArray(deletedTemplate) ? deletedTemplate : [deletedTemplate];
    
    if (deletedResults.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}, "admin"); // Only admins can delete templates
