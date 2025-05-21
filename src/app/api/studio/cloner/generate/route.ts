import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';
import { openAIService } from '@/lib/external-api/services/openai';
import { geminiService, GeminiImageGenerationOptions } from '@/lib/external-api/services/gemini'; // New
import { db } from '@/db';
import { assets } from '@/db/schema/assets';
import uploadFile from '@/lib/s3/uploadFile';
import { openAIConfig } from '@/lib/external-api/config'; // For default OpenAI model

/**
 * API endpoint to generate images using OpenAI or Gemini
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

    let imageB64Json: string | undefined = undefined;
    let generatedModelName: string = settings.model || openAIConfig.defaultModel; // Default model
    let generationProvider: string = 'openai'; // Default provider
    const isGemini = generatedModelName.startsWith('imagen');

    if (isGemini) {
      generationProvider = 'gemini';
      let sourceImageBase64: string | undefined = undefined;

      if (sourceImage) {
        try {
          const imageResponse = await fetch(sourceImage);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch source image: ${imageResponse.statusText} (status: ${imageResponse.status}) from ${sourceImage}`);
          }
          const imageArrayBuffer = await imageResponse.arrayBuffer();
          sourceImageBase64 = Buffer.from(imageArrayBuffer).toString('base64');
        } catch (fetchError) {
          console.error('Error fetching source image for Gemini:', fetchError);
          return NextResponse.json(
            { error: 'Failed to load reference image for Gemini', details: (fetchError as Error).message },
            { status: 500 }
          );
        }
      }
      // Note: If the specific Gemini model *requires* a reference image and sourceImageBase64 is undefined,
      // the geminiService call might fail. This should be handled by the service or specific model logic if necessary.

      const geminiOptions: GeminiImageGenerationOptions = {
        prompt: prompt,
        referenceImageB64: sourceImageBase64,
        numberOfImages: settings.n || 1, // Assuming settings.n might be passed for number of images
        aspectRatio: settings.size ? settings.size.replace('x', ':') : undefined, // e.g. "1024x1024" to "1024:1024"
        // Add other specific Gemini parameters from settings if available
        // quality: settings.quality, 
        // style: settings.style, (if applicable and different from OpenAI's interpretation)
      };
      
      const generationResult = await geminiService.generateImageWithReference(geminiOptions);
      imageB64Json = generationResult.predictions?.[0]?.bytesBase64Encoded;
      // Ensure the model name stored is the one actually used, especially if there's a default within geminiService
      generatedModelName = geminiService.defaultModel; // Or whatever model was resolved in the service

    } else { // OpenAI
      generationProvider = 'openai';
      // Ensure generatedModelName is correctly set if it was defaulted or came from settings
      generatedModelName = settings.model || openAIConfig.defaultModel;

      const generationResult = await openAIService.generateImage(prompt, {
        model: generatedModelName,
        size: settings.size || '1024x1024', // Default OpenAI size
        style: settings.style || 'vivid', // Default OpenAI style
        n: settings.n || 1, // Number of images
        responseFormat: 'b64_json',
      });
      imageB64Json = generationResult.data?.[0]?.b64_json;
    }
    
    if (!imageB64Json) {
      return NextResponse.json(
        { error: 'Failed to generate image or extract base64 data from the provider.' },
        { status: 500 }
      );
    }
    
    // Convert base64 to buffer for S3 upload
    const imageBuffer = Buffer.from(imageB64Json, 'base64');
    
    // Determine dimensions from settings or default.
    // For Gemini, aspectRatio was used, so size might need to be re-evaluated or stored differently.
    // For now, assume settings.size is the intended display/storage dimension.
    const dimensions = settings.size?.split('x') || (isGemini ? ['1024', '1024'] : ['1024', '1024']); // Default if not specified


    // Upload generated image to S3
    const imageResult = await uploadFile(
      imageBuffer,
      'image/png', // Assuming PNG, Gemini might specify mimeType
      `assets/${organization.id}/cloner/generated`,
      `cloner-${Date.now()}.png`
    );
    
    const thumbnailUrl = imageResult.url; // Create thumbnail (same image for now)
    
    // Save as asset in database
    const [newAsset] = await db.insert(assets).values({
      name: prompt.substring(0, 50) || 'Generated Image',
      type: 'image',
      studioTool: 'image_editor', // Or 'cloner' if that's more specific
      status: 'draft',
      thumbnail: thumbnailUrl,
      content: {
        version: 1,
        settings: {
          prompt,
          model: generatedModelName, // Actual model used
          size: settings.size || (isGemini ? `${dimensions[0]}x${dimensions[1]}` : '1024x1024'), // Store consistent size
          style: settings.style, // Store style if provided
          provider: generationProvider, // Store the provider
          // Potentially store other relevant settings like quality, n, etc.
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
          sourceImage: sourceImage,
          generationMethod: 'cloner',
          generationDate: new Date().toISOString(),
          // Any other provider-specific metadata could go here
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
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { 
        error: 'Image generation failed',
        details: (error instanceof Error ? error.message : String(error))
      },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
