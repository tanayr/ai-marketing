import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';
import { db } from '@/db';
import { assets } from '@/db/schema/assets';
import uploadFile from '@/lib/s3/uploadFile';

/**
 * API endpoint to save generated images from streaming responses
 * Used to persist the final image after streaming is complete
 */
export const POST = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const { base64Image, prompt, settings, sourceImage } = await req.json();
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    if (!base64Image) {
      return NextResponse.json(
        { error: 'No image data provided' }, 
        { status: 400 }
      );
    }
    
    // Convert base64 to buffer for S3 upload
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const dimensions = settings?.size?.split('x') || ['1024', '1024'];
    
    // Upload generated image to S3
    const imageResult = await uploadFile(
      imageBuffer,
      'image/png',
      `assets/${organization.id}/cloner/generated`,
      `cloner-${Date.now()}.png`
    );
    
    // Create thumbnail (same image for now, could resize if needed)
    const thumbnailUrl = imageResult.url;
    
    // Save as asset in database
    const [newAsset] = await db.insert(assets).values({
      name: prompt?.substring(0, 50) || 'Generated Image',
      type: 'image',
      studioTool: 'cloner',
      status: 'draft',
      thumbnail: thumbnailUrl,
      content: {
        version: 1,
        settings: {
          prompt,
          model: settings?.model || 'gpt-image-1',
          size: settings?.size || '1024x1024',
          style: settings?.style || 'vivid',
        },
        elements: [
          {
            type: 'image',
            src: imageResult.url,
            x: 0, y: 0,
            width: parseInt(dimensions[0]),
            height: parseInt(dimensions[1]),
          }
        ],
        metadata: {
          sourceImage: sourceImage, // Store reference to original source image if provided
          generationMethod: 'cloner',
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
    console.error('Image saving error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save generated image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
