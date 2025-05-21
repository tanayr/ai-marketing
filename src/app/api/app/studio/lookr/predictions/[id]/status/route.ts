import { NextResponse } from "next/server";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { db } from "@/db";
import { lookrPredictions } from "@/db/schema/lookr_predictions";
import { assets } from "@/db/schema/assets"; // Needed for fetching asset URL
import { eq } from "drizzle-orm";

// Get the prediction status from the local database
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const fashnAiJobId = context.params.id as string;

    const results = await db
      .select()
      .from(lookrPredictions)
      .where(eq(lookrPredictions.fashnAiPredictionId, fashnAiJobId))
      .limit(1);

    const job = results[0];

    if (!job) {
      return NextResponse.json(
        { error: "Prediction not found or not initiated through our system." },
        { status: 404 }
      );
    }

    // Construct a FashnAI-like status response based on our DB record
    let responseBody: {
      id: string;
      status: string;
      output_urls?: string[];
      error?: string;
      // Potentially include other fields from job.inputParams if FashnAI includes them
      // For example: input_parameters?: any;
    } = {
      id: job.fashnAiPredictionId,
      status: "unknown", // Default, will be overwritten
      // input_parameters: job.inputParams, // Uncomment if FashnAI response includes this
    };

    if (job.status === "COMPLETED") {
      responseBody.status = "completed";
      if (job.assetId) {
        const assetResults = await db.select({ 
            // Assuming asset content structure from previous steps
            // content: assets.content as any, // Cast if schema is too strict for dynamic access
            // For type safety, directly access known fields if possible, or ensure 'content' type is correct
            // For this example, assuming `assets.content` allows access to `.elements[0].src`
            // It's better if `assets.content` has a well-defined type that includes `elements`
            assetContent: assets.content 
        })
        .from(assets)
        .where(eq(assets.id, job.assetId))
        .limit(1);
        
        // Safely access nested properties
        const assetContent = assetResults[0]?.assetContent as any; // Use 'as any' if type is complex/unknown
        const imageUrl = assetContent?.elements?.[0]?.src;

        if (imageUrl) {
          responseBody.output_urls = [imageUrl];
        } else {
          console.warn(`Asset content or src URL not found for completed job ${job.id} with assetId ${job.assetId}`);
          responseBody.output_urls = []; // Or handle as error if URL expected but not found
        }
      } else {
         console.warn(`AssetId missing for completed job ${job.id}`);
         responseBody.output_urls = []; // Should ideally have an assetId if completed
      }
    } else if (job.status === "FAILED") {
      responseBody.status = "failed";
      responseBody.error = job.errorMessage || "Job processing failed.";
    } else if (job.status === "PROCESSING" || job.status === "PENDING") {
      // Map both PENDING and PROCESSING in our system to "processing" for FashnAI compatibility
      responseBody.status = "processing"; 
    } else {
      // This case should ideally not be reached if status enum is exhaustive
      console.error(`Unhandled job status: ${job.status} for job ID ${job.id}`);
      responseBody.status = "unknown"; // Fallback status
      responseBody.error = `Unknown job state '${job.status}' in our system.`;
    }
    
    return NextResponse.json(responseBody);

  } catch (error) {
    console.error("Error getting prediction status from DB:", error);
    return NextResponse.json(
      { error: "Failed to get prediction status from internal system" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can check prediction status
