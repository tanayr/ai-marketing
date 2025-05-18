import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema/assets";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";

// Validation schema for creating a new design
const createDesignSchema = z.object({
  name: z.string().min(1, "Design name is required"),
  width: z.number().min(50).max(3000).default(800),
  height: z.number().min(50).max(3000).default(600),
  backgroundColor: z.string().default("#ffffff"),
});

// Create a new Retouchr design
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    // Parse and validate request body
    const body = await req.json();
    const validData = createDesignSchema.parse(body);
    
    // Create initial canvas data
    const initialCanvas = {
      version: "5.3.0", // Current fabric version
      objects: [],
      background: validData.backgroundColor,
      width: validData.width,
      height: validData.height,
    };
    
    // Create new asset
    const newAsset = await db.insert(assets).values({
      name: validData.name,
      type: "image",
      studioTool: "image_editor", // Using existing enum value instead of "retouchr"
      status: "draft",
      content: {
        version: 1,
        fabricCanvas: initialCanvas,
        retouchr: {
          name: validData.name,
          lastSavedBy: user.id,
          lastSavedAt: new Date().toISOString(),
          usedImages: [],
        }
      },
      organizationId: organization.id,
      createdById: user.id,
      lastEditedById: user.id,
    }).returning();
    
    return NextResponse.json(newAsset[0]);
  } catch (error) {
    console.error("Error creating design:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create design" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can create designs

// Get all designs for the current organization
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    
    // Get all retouchr designs for this organization
    const designs = await db.query.assets.findMany({
      where: (assets, { and, eq }) => and(
        eq(assets.organizationId, organization.id),
        eq(assets.studioTool, "image_editor") // Using existing enum value instead of "retouchr"
      ),
      orderBy: (assets, { desc }) => [desc(assets.updatedAt)],
    });
    
    return NextResponse.json(designs);
  } catch (error) {
    console.error("Error fetching designs:", error);
    return NextResponse.json(
      { error: "Failed to fetch designs" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can view designs
