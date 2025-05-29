import { NextResponse } from "next/server";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";
import { openAIService } from "@/lib/external-api/services/openai";
import { OrganizationRole } from "@/db/schema/organization";
import { ReadableStream } from "stream/web";

// Validation schema for AI generation
const generationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  inspirationId: z.string().min(1, "Inspiration ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  width: z.number().min(50).max(3000),
  height: z.number().min(50).max(3000),
  referenceImageUrl: z.string().optional(),
  size: z.string().optional(),
  partialImages: z.number().min(1).max(3).optional().default(3),
});

/**
 * Determine optimal image size for AI generation based on dimensions
 */
function getOptimalImageSize(width: number, height: number): string {
  const aspectRatio = width / height;
  
  if (aspectRatio > 1.3) return '1792x1024'; // Landscape
  if (aspectRatio < 0.8) return '1024x1792'; // Portrait
  return '1024x1024'; // Square
}

/**
 * Generate AI image with streaming support using OpenAI
 * Requires organization authentication
 */
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    // Get user and organization from context
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    console.log(`AI generation request from user: ${user.id} in organization: ${organization.id}`);
    
    // Parse and validate request body
    const body = await req.json();
    const validData = generationSchema.parse(body);
    
    // Determine optimal size for AI generation if not provided
    const size = validData.size || getOptimalImageSize(validData.width, validData.height);
    
    console.log(`Generating AI image with prompt: "${validData.prompt.substring(0, 50)}..."`);
    console.log(`Image size: ${size}, Reference image: ${validData.referenceImageUrl ? 'Yes' : 'No'}`);
    
    // Create a streaming response
    try {
      // Request the stream from OpenAI
      const openaiStream = await openAIService.streamGenerateImage(
        validData.prompt,
        {
          model: 'gpt-4.1',
          referenceImage: validData.referenceImageUrl,
          size,
          stream: true,
          partialImages: validData.partialImages // Already validated to be <= 3
        }
      );
      
      if (!openaiStream) {
        throw new Error('Failed to get stream from OpenAI');
      }
      
      // Transform the OpenAI stream to a properly formatted SSE stream
      const transformedStream = new ReadableStream({
        async start(controller) {
          const reader = openaiStream.getReader();
          const encoder = new TextEncoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Forward the raw chunk data - it's already in SSE format
              controller.enqueue(value);
            }
            controller.close();
          } catch (error) {
            console.error('Error processing OpenAI stream:', error);
            controller.error(error);
          }
        }
      });
      
      // Set appropriate headers for streaming
      const headers = new Headers();
      headers.set('Content-Type', 'text/event-stream');
      headers.set('Cache-Control', 'no-cache');
      headers.set('Connection', 'keep-alive');
      
      // Return the transformed stream with proper headers
      return new Response(transformedStream, { headers });
    } catch (streamError) {
      console.error('Error creating stream:', streamError);
      return NextResponse.json(
        { error: "Failed to create image generation stream", details: streamError instanceof Error ? streamError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in AI generation:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    // Provide more detailed error response for debugging
    let errorMessage = "Failed to generate image";
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        time: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}, "user"); // Regular users can use AI generation
