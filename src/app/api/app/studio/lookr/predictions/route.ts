import { NextResponse } from "next/server";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";
import { FashnAIClient } from "@/lib/external-api/fashn-ai-client";
import { db } from "@/db";
import { avatars } from "@/db/schema/avatars";
import { eq, and, sql } from "drizzle-orm";

// Validation schema for creating a prediction
const createPredictionSchema = z.object({
  productSource: z.object({
    type: z.enum(["upload", "asset"]),
    id: z.string().optional(),
    name: z.string(),
    url: z.string(),
    localStorageKey: z.string().optional(),
  }),
  avatarId: z.string(),
  options: z.object({
    category: z.enum(["auto", "tops", "bottoms", "one-pieces"]).optional(),
    segmentation_free: z.boolean().optional(),
    moderation_level: z.enum(["conservative", "permissive", "none"]).optional(),
    garment_photo_type: z.enum(["auto", "flat-lay", "model"]).optional(),
    mode: z.enum(["performance", "balanced", "quality"]).optional(),
    seed: z.number().optional(),
    num_samples: z.number().min(1).max(4).optional(),
    output_format: z.enum(["png", "jpeg"]).optional(),
    return_base64: z.boolean().optional(),
  }).optional(),
});

// Create a new prediction
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    
    // Parse and validate request body
    const body = await req.json();
    const validData = createPredictionSchema.parse(body);
    
    // Verify avatar exists and either belongs to organization or is common
    const avatarResults = await db
      .select()
      .from(avatars)
      .where(
        and(
          eq(avatars.id, validData.avatarId),
          // Avatar must either belong to this organization OR be a common avatar
          sql`(${avatars.organizationId} = ${organization.id} OR ${avatars.isCommon} = true)`
        )
      )
      .limit(1);
      
    const avatar = avatarResults[0];
    
    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar not found" },
        { status: 404 }
      );
    }
    
    // Get the FashnAI API key from environment variables
    const apiKey = process.env.FASHNAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FashnAI API key not configured" },
        { status: 500 }
      );
    }
    
    // Create FashnAI client
    const fashnAIClient = new FashnAIClient(apiKey);
    
    // Make the API call to create a prediction
    const prediction = await fashnAIClient.createPrediction(
      avatar.imageUrl,           // model_image
      validData.productSource.url, // garment_image
      validData.options || {}
    );
    
    if (prediction.error) {
      return NextResponse.json(
        { error: prediction.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(prediction);
    
  } catch (error) {
    console.error("Error creating prediction:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can create predictions
