import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';
import { openAIService } from '@/lib/external-api/services/openai';
import { db } from '@/db';
import { assets } from '@/db/schema/assets';
import uploadFile from '@/lib/s3/uploadFile';

/**
 * API endpoint to generate images using OpenAI
 */
export const POST = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const { prompt, sourceImage, settings = {} } = await req.json();
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    // Validate input
    if (!prompt || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'A prompt is required for image generation' }, 
        { status: 400 }
      );
    }
    
    // Call OpenAI to generate image
    const generationResult = await openAIService.generateImage(prompt, {
      model: settings.model || 'gpt-image-1',
      size: settings.size || '1024x1024',
      style: settings.style || 'vivid',
      responseFormat: 'b64_json', // Get base64 data directly
    });
    
    if (!generationResult.data?.[0]?.b64_json) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }
    
    // Convert base64 to buffer for S3 upload
    const imageBuffer = Buffer.from(generationResult.data[0].b64_json, 'base64');
    const dimensions = settings.size?.split('x') || ['1024', '1024'];
    
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
      name: prompt.substring(0, 50) || 'Generated Image',
      type: 'image',
      studioTool: 'cloner', // Using cloner as the studio tool
      status: 'draft',
      thumbnail: thumbnailUrl,
      content: {
        version: 1,
        settings: {
          prompt,
          model: settings.model || 'gpt-image-1',
          size: settings.size || '1024x1024',
          style: settings.style || 'vivid',
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
    console.error('Image generation error:', error);
    return NextResponse.json(
      { 
        error: 'Image generation failed',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
