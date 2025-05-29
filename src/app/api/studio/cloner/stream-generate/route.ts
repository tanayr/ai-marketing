import { NextRequest } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';
import { openAIService } from '@/lib/external-api/services/openai';

/**
 * API endpoint to stream image generation using OpenAI's Responses API
 * Provides streaming with partial image generation updates
 */
export const POST = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const { prompt, sourceImage, settings = {} } = await req.json();
    
    // Basic validation
    if (!prompt || prompt.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'A prompt is required for image generation' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Call OpenAI with streaming enabled
    const stream = await openAIService.streamGenerateImage(prompt, {
      model: settings.model || 'gpt-image-1',
      size: settings.size || '1024x1024',
      style: settings.style || 'vivid',
      partialImages: settings.partialImages || 2,
      referenceImage: sourceImage
    });
    
    // Set appropriate headers for streaming
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    headers.set('X-Accel-Buffering', 'no'); // Prevents buffering for proxies
    
    return new Response(stream, { headers });
  } catch (error) {
    console.error('Streaming image generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Image generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}, OrganizationRole.enum.user);
