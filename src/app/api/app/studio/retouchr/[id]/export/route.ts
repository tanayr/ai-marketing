import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets, assetVersions } from "@/db/schema/assets";
import { files } from "@/db/schema/files"; 
import { eq } from "drizzle-orm";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";
import { uploadFile } from "@/lib/s3/uploadFile";

// Validation schema for exporting a design
const exportDesignSchema = z.object({
  format: z.enum(["png", "jpeg"]),
  quality: z.number().min(10).max(100).default(90),
  dataUrl: z.string(),
  filename: z.string().default("design"),
});

// Export a design to file
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const params = await context.params;
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    const designId = params.id as string;
    
    // Parse and validate request body
    const body = await req.json();
    const validData = exportDesignSchema.parse(body);
    
    // Verify design exists and belongs to organization
    const design = await db.query.assets.findFirst({
      where: (assets, { and, eq }) => and(
        eq(assets.id, designId),
        eq(assets.organizationId, organization.id)
      ),
    });
    
    if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }
    
    // Process data URL to buffer
    const base64Data = validData.dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine content type
    const contentType = validData.format === 'png' 
      ? 'image/png' 
      : 'image/jpeg';
    
    // Generate filename
    const sanitizedFilename = validData.filename
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    
    const fileName = `${sanitizedFilename}.${validData.format}`;
    const filePath = `organizations/${organization.id}/retouchr/${designId}/${fileName}`;
    
    // Upload file to S3
    const { fileKey, fileUrl } = await uploadFile({
      buffer,
      fileName,
      filePath,
      contentType,
    });
    
    // Save file record in database
    const fileRecord = await db.insert(files).values({
      organizationId: organization.id,
      userId: user.id,
      fileName,
      fileKey,
      fileUrl,
      contentType,
      filePath,
      fileSize: buffer.length.toString(),
    }).returning();
    
    // Update design with thumbnail if it doesn't have one
    if (!design.thumbnail) {
      await db.update(assets)
        .set({
          thumbnail: fileUrl,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, designId));
    }
    
    return NextResponse.json({
      success: true,
      file: fileRecord[0]
    });
  } catch (error) {
    console.error("Error exporting design:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to export design" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can export designs
