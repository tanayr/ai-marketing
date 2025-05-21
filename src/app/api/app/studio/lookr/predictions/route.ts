import { NextResponse } from "next/server";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { z } from "zod";
import { FashnAIClient } from "@/lib/external-api/fashn-ai-client";
import { db } from "@/db";
import { avatars } from "@/db/schema/avatars";
import { eq, and, sql } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client"; // Renamed to avoid conflict
import { lookrPredictions } from "@/db/schema/lookr_predictions";

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
    const fashnAiApiResponse = await fashnAIClient.createPrediction(
      avatar.imageUrl,           // model_image
      validData.productSource.url, // garment_image
      validData.options || {}
    );
    
    // Handle FashnAI's own error response first
    if (fashnAiApiResponse.error) {
      return NextResponse.json(
        { error: fashnAiApiResponse.error },
        { status: 400 } // Or appropriate status based on FashnAI error
      );
    }

    // Assuming fashnAiApiResponse.id is the prediction ID from Fashn.ai
    // If FashnAI uses 'prediction_id', this should be fashnAiApiResponse.prediction_id
    const fashnAiPredictionId = fashnAiApiResponse.id; 
    
    if (!fashnAiPredictionId) {
        console.error("Fashn.ai prediction ID not found in response", fashnAiApiResponse);
        // Still return the original response to the client as it might contain error details from FashnAI
        return NextResponse.json(fashnAiApiResponse); 
    }

    try {
      // Create a record in our database
      const [newLookrPredictionRecord] = await db.insert(lookrPredictions).values({
        fashnAiPredictionId: fashnAiPredictionId,
        status: "PROCESSING", // Initial status
        sourceModelImageUrl: avatar.imageUrl,
        sourceGarmentImageUrl: validData.productSource.url,
        inputParams: validData.options || {},
        organizationId: organization.id,
        createdById: context.session.user.id,
        // poll_count is defaulted by DB, assetId is nullable, error_message is nullable
      }).returning(); // Ensure you get the inserted record, especially its 'id'

      if (!newLookrPredictionRecord) {
          console.error("Failed to create lookr prediction record in DB for FashnAI ID:", fashnAiPredictionId);
          // Even if DB insert fails, the job is created on FashnAI.
          // For frontend compatibility, still return the FashnAI response.
          // Log this error for backend monitoring.
      } else {
        // Send event to Inngest only if DB record was successfully created
        await inngest.send({
          name: "fashn.ai/prediction.poll",
          data: {
            lookrPredictionDbId: newLookrPredictionRecord.id,
            fashnAiPredictionId: fashnAiPredictionId,
            organizationId: organization.id,
            createdById: context.session.user.id,
            originalFileName: validData.productSource.name,
          },
        });
      }
    } catch (dbError) {
      // Catch errors specifically from DB insert or Inngest send
      console.error("Error during DB operation or Inngest send for FashnAI ID:", fashnAiPredictionId, dbError);
      // Log this error for backend monitoring.
      // The FashnAI job is already created, so we still return the original FashnAI response.
    }
    
    // Return the original FashnAI API response to the client
    return NextResponse.json(fashnAiApiResponse);
    
  } catch (error) {
    console.error("Error creating prediction (outer try-catch):", error);
    
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
