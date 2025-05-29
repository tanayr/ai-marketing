import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';
import { db } from '@/db';
import { assets } from '@/db/schema/assets';
import uploadFile from '@/lib/s3/uploadFile';
import { z } from 'zod';

// Schema validation for request
const saveImageSchema = z.object({
  base64Image: z.string().min(1, "Image data is required"),
  inspirationId: z.string().min(1, "Inspiration ID is required"),
  productId: z.string().optional(),
  width: z.number().min(1, "Width is required"),
  height: z.number().min(1, "Height is required"),
  name: z.string().optional(),
});

/**
 * API endpoint to save generated AI images to assets
 * Used to persist the final image after AI generation is complete
 */
export const POST = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const requestData = await req.json();
    const validatedData = saveImageSchema.parse(requestData);
    
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    // Extract the base64 data (remove data:image/jpeg;base64, prefix if present)
    let base64Data = validatedData.base64Image;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Convert base64 to buffer for S3 upload
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Upload generated image to S3
    const imageResult = await uploadFile(
      imageBuffer,
      'image/jpeg',
      `assets/${organization.id}/retouchr/ai-generated`,
      `ai-generated-${Date.now()}.jpg`
    );
    
    // Use the same image as thumbnail for now
    const thumbnailUrl = imageResult.url;
    
    // Create asset name if not provided
    const assetName = validatedData.name || `AI Generated Image ${new Date().toLocaleDateString()}`;
    
    // Save as asset in database
    const [newAsset] = await db.insert(assets).values({
      name: assetName,
      type: 'image',
      studioTool: 'retouchr',
      status: 'ready',
      thumbnail: thumbnailUrl,
      content: {
        version: 1,
        elements: [
          {
            type: 'image',
            src: imageResult.url,
            x: 0, y: 0,
            width: validatedData.width,
            height: validatedData.height,
          }
        ],
        metadata: {
          inspirationId: validatedData.inspirationId,
          productId: validatedData.productId,
          generationMethod: 'ai',
          generationDate: new Date().toISOString(),
        }
      },
      organizationId: organization.id,
      createdById: user.id,
      lastEditedById: user.id,
    }).returning();

    return NextResponse.json({
      success: true,
      asset: newAsset,
      imageUrl: imageResult.url,
    });
  } catch (error) {
    console.error('AI image saving error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save generated image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
