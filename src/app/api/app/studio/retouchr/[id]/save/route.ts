import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets, assetVersions } from "@/db/schema/assets";
import { eq, and } from "drizzle-orm";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";

// Validation schema for saving a design
const saveDesignSchema = z.object({
  canvasJSON: z.string(),
  createVersion: z.boolean().default(false),
  versionNotes: z.string().optional(),
});

// Save a design
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const params = await context.params;
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    const designId = params.id as string;
    
    // Parse and validate request body
    const body = await req.json();
    console.log('BACKEND: Save request received for design:', designId);
    
    const validData = saveDesignSchema.parse(body);
    console.log('BACKEND: Validated data structure:', {
      hasCanvasJSON: !!validData.canvasJSON,
      createVersion: validData.createVersion,
      jsonLength: validData.canvasJSON?.length || 0
    });
    
    // Get current design
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
    
    // Parse canvas data
    let canvasData;
    try {
      canvasData = JSON.parse(validData.canvasJSON);
      console.log('BACKEND: Successfully parsed canvas JSON');
      console.log('BACKEND: Canvas data structure:', {
        version: canvasData.version,
        width: canvasData.width,
        height: canvasData.height,
        objectsCount: Array.isArray(canvasData.objects) ? canvasData.objects.length : 'N/A',
        background: canvasData.background
      });
    } catch (error) {
      console.error('BACKEND: Failed to parse canvas JSON:', error);
      return NextResponse.json(
        { error: "Invalid canvas data" },
        { status: 400 }
      );
    }
    
    // Temporarily disable versioning due to foreign key constraint error
    // We'll log that a version was requested but couldn't be created
    if (validData.createVersion) {
      console.log('Version creation requested but skipped due to schema constraints for asset:', design.id);
      // In a future update, fix the schema or use direct SQL if needed
    }
    
    // Construct new content with updated fabricCanvas
    const updatedContent = {
      ...design.content,
      version: (design.content?.version || 0) + 1,
      fabricCanvas: canvasData,
      retouchr: {
        ...design.content?.retouchr,
        lastSavedBy: user.id,
        lastSavedAt: new Date().toISOString(),
      }
    };
    
    // Extract used images from canvas objects
    const usedImages = canvasData.objects
      .filter((obj: { type: string; src?: string }) => obj.type === 'image' && obj.src)
      .map((obj: { src: string }) => obj.src);
    
    if (usedImages.length > 0) {
      updatedContent.retouchr.usedImages = usedImages;
    }
    
    console.log('Attempting to save design with ID:', designId);
    console.log('Updated content structure:', JSON.stringify({
      version: updatedContent.version,
      fabricCanvasSize: {
        width: updatedContent.fabricCanvas?.width,
        height: updatedContent.fabricCanvas?.height
      },
      hasObjects: Array.isArray(updatedContent.fabricCanvas?.objects) && updatedContent.fabricCanvas?.objects.length > 0
    }));
    
    try {
      // Update design
      const updatedDesign = await db.update(assets)
        .set({
          content: updatedContent,
          lastEditedById: user.id,
          status: "draft", // Ensure status is set
          updatedAt: new Date(),
        })
        .where(eq(assets.id, designId))
        .returning();
      
      console.log('Design saved successfully:', updatedDesign.length > 0 ? 'Yes' : 'No');
      
      if (!updatedDesign || updatedDesign.length === 0) {
        throw new Error('Update operation did not return updated design');
      }
      
      console.log('BACKEND: Design saved successfully with content structure:',  {
        contentVersion: updatedDesign[0].content?.version,
        hasFabricCanvas: !!updatedDesign[0].content?.fabricCanvas,
        updatedAt: updatedDesign[0].updatedAt
      });
      
      return NextResponse.json(updatedDesign[0]);
    } catch (updateError) {
      console.error('Error in update operation:', updateError);
      
      // Fallback: If the update fails, try a direct query to check if the design exists
      const checkDesign = await db
        .select()
        .from(assets)
        .where(eq(assets.id, designId));
      
      console.log('Design exists check:', checkDesign.length > 0 ? 'Yes' : 'No');
      
      throw updateError; // Re-throw to be caught by the outer catch block
    }
    
  } catch (error) {
    console.error("Error saving design:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to save design", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can save designs
