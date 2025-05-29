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

// Validation schema for creative inspirations
const inspirationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url("Please enter a valid URL"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  width: z.string().min(1, "Width is required"),
  height: z.string().min(1, "Height is required"),
  tags: z.array(z.string()).optional(),
  linkedTemplateId: z.string().optional().nullable(),
});

/**
 * GET handler for fetching all creative inspirations (Super Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify the user is a super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized - Only super admins can access this endpoint" },
        { status: 403 }
      );
    }

    const allInspirations = await db
      .select()
      .from(creativeInspirations)
      .orderBy(creativeInspirations.createdAt);
    
    return NextResponse.json(allInspirations);
  } catch (error) {
    console.error("Error fetching creative inspirations:", error);
    return NextResponse.json(
      { error: "Failed to fetch creative inspirations" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new creative inspiration (Super Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the user is a super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized - Only super admins can access this endpoint" },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validData = inspirationSchema.parse(body);
    
    // Create new creative inspiration
    const newInspiration = await db.insert(creativeInspirations).values({
      name: validData.name,
      imageUrl: validData.imageUrl,
      prompt: validData.prompt,
      width: validData.width,
      height: validData.height,
      tags: validData.tags || [],
      linkedTemplateId: validData.linkedTemplateId || null,
      createdById: session.user.id,
    }).returning();
    
    return NextResponse.json(newInspiration[0]);
  } catch (error) {
    console.error("Error creating creative inspiration:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create creative inspiration" },
      { status: 500 }
    );
  }
}
