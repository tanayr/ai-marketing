import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { creativeInspirations } from "@/db/schema/creative-inspirations";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];

// Helper function to check if a user is a super admin
async function isSuperAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return SUPER_ADMIN_EMAILS.includes(session.user.email);
}

// Validation schema for updating creative inspirations
const updateInspirationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url("Please enter a valid URL"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  width: z.string().min(1, "Width is required"),
  height: z.string().min(1, "Height is required"),
  tags: z.array(z.string()).optional(),
  linkedTemplateId: z.string().optional().nullable(),
});

/**
 * GET handler for fetching a specific creative inspiration by ID (Super Admin only)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is a super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized - Only super admins can access this endpoint" },
        { status: 403 }
      );
    }

    const { id } = params;
    
    const inspiration = await db
      .select()
      .from(creativeInspirations)
      .where(eq(creativeInspirations.id, id))
      .limit(1);
    
    if (inspiration.length === 0) {
      return NextResponse.json(
        { error: "Creative inspiration not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(inspiration[0]);
  } catch (error) {
    console.error("Error fetching creative inspiration:", error);
    return NextResponse.json(
      { error: "Failed to fetch creative inspiration" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a creative inspiration by ID (Super Admin only)
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is a super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized - Only super admins can access this endpoint" },
        { status: 403 }
      );
    }

    const { id } = params;
    
    // Check if inspiration exists
    const existing = await db
      .select({ id: creativeInspirations.id })
      .from(creativeInspirations)
      .where(eq(creativeInspirations.id, id))
      .limit(1);
    
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Creative inspiration not found" },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validData = updateInspirationSchema.parse(body);
    
    // Update the creative inspiration
    const updated = await db
      .update(creativeInspirations)
      .set({
        name: validData.name,
        imageUrl: validData.imageUrl,
        prompt: validData.prompt,
        width: validData.width,
        height: validData.height,
        tags: validData.tags || [],
        linkedTemplateId: validData.linkedTemplateId || null,
        updatedAt: new Date(),
      })
      .where(eq(creativeInspirations.id, id))
      .returning();
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating creative inspiration:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update creative inspiration" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a creative inspiration by ID (Super Admin only)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is a super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized - Only super admins can access this endpoint" },
        { status: 403 }
      );
    }

    const { id } = params;
    
    // Check if inspiration exists
    const existing = await db
      .select({ id: creativeInspirations.id })
      .from(creativeInspirations)
      .where(eq(creativeInspirations.id, id))
      .limit(1);
    
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Creative inspiration not found" },
        { status: 404 }
      );
    }
    
    // Delete the creative inspiration
    await db
      .delete(creativeInspirations)
      .where(eq(creativeInspirations.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting creative inspiration:", error);
    return NextResponse.json(
      { error: "Failed to delete creative inspiration" },
      { status: 500 }
    );
  }
}
