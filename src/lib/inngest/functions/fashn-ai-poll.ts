import { inngest } from "../client";
import { FashnAIClient, FashnAIError } from "@/lib/external-api/fashn-ai-client";
import { db } from "@/db";
import { lookrPredictions } from "@/db/schema/lookr_predictions";
import { assets } from "@/db/schema/assets";
import { eq } from "drizzle-orm";
import uploadFile from "@/lib/s3/uploadFile"; // Assuming this utility exists and is configured

const MAX_POLL_ATTEMPTS = 60; // e.g., 60 attempts * 10s delay = 10 minutes timeout
const POLL_INTERVAL_SECONDS = 10;

interface FashnAiPredictionPayload {
  lookrPredictionDbId: string;
  fashnAiPredictionId: string;
  organizationId: string;
  createdById: string;
  // Any other relevant details, e.g., original file name for S3
  originalFileName?: string; 
}

export const pollFashnAiPredictionStatus = inngest.createFunction(
  { id: "fashn-ai-poll-prediction-status" },
  { event: "fashn.ai/prediction.poll" },
  async ({ event, step }) => {
    const { lookrPredictionDbId, fashnAiPredictionId, organizationId, createdById, originalFileName } = event.data as FashnAiPredictionPayload;

    const predictionRecord = await step.run("fetch-db-record", async () => {
      return db.select().from(lookrPredictions).where(eq(lookrPredictions.id, lookrPredictionDbId)).limit(1);
    });

    if (!predictionRecord || predictionRecord.length === 0) {
      console.error(`Lookr prediction record not found: ${lookrPredictionDbId}`);
      return { error: "Database record not found" };
    }

    let currentPollCount = predictionRecord[0].pollCount || 0;

    // Check for max attempts
    if (currentPollCount >= MAX_POLL_ATTEMPTS) {
      await step.run("update-db-timeout", async () => {
        return db.update(lookrPredictions)
          .set({ status: "FAILED", errorMessage: "Polling timed out after " + MAX_POLL_ATTEMPTS + " attempts.", updatedAt: new Date() })
          .where(eq(lookrPredictions.id, lookrPredictionDbId));
      });
      return { error: "Polling timed out" };
    }

    const apiKey = process.env.FASHNAI_API_KEY;
    if (!apiKey) {
      console.error("FashnAI API key not configured for Inngest poller.");
      // Mark as failed permanently or retry with a longer delay if it's a config issue
      await step.run("update-db-apikey-failure", async () => {
        return db.update(lookrPredictions)
          .set({ status: "FAILED", errorMessage: "FashnAI API key not configured on server.", updatedAt: new Date() })
          .where(eq(lookrPredictions.id, lookrPredictionDbId));
      });
      return { error: "FashnAI API key not configured" };
    }
    const fashnAIClient = new FashnAIClient(apiKey);

    try {
      const statusResponse = await step.run("get-fashn-ai-status", async () => {
        return fashnAIClient.getPredictionStatus(fashnAiPredictionId);
      });

      currentPollCount++;

      if (statusResponse.status === "completed" && statusResponse.output_urls && statusResponse.output_urls.length > 0) {
        // Assuming first URL is the primary image
        const imageUrlToFetch = statusResponse.output_urls[0];
        
        const imageFetchResponse = await step.run("fetch-generated-image", async () => {
          return fetch(imageUrlToFetch);
        });

        if (!imageFetchResponse.ok) {
          throw new Error(`Failed to fetch generated image from Fashn.ai: ${imageFetchResponse.statusText}`);
        }
        const imageArrayBuffer = await imageFetchResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        const s3FileName = `assets/${organizationId}/lookr/generated/${fashnAiPredictionId}-${originalFileName || 'generated_image'}.png`;
        
        const s3UploadResult = await step.run("upload-to-s3", async () => {
          return uploadFile(
            imageBuffer,
            'image/png', // Assuming PNG, or derive from FashnAI response if available
            `assets/${organizationId}/lookr/generated`, // S3 path prefix
            `${fashnAiPredictionId}-${originalFileName || 'generated_image'}.png`
          );
        });

        // Create a new asset record
        const [newAsset] = await step.run("create-asset-record", async () => {
          return db.insert(assets).values({
            name: originalFileName || `Lookr Asset ${fashnAiPredictionId}`,
            type: 'image',
            studioTool: 'lookr',
            status: 'ready',
            thumbnail: s3UploadResult.url, // Use S3 URL as thumbnail
            content: {
              version: 1,
              settings: predictionRecord[0].inputParams, // Save original input params
              elements: [{ type: 'image', src: s3UploadResult.url, x:0, y:0 }], // Simplified content
              metadata: {
                fashnAiPredictionId: fashnAiPredictionId,
                sourceModelImageUrl: predictionRecord[0].sourceModelImageUrl,
                sourceGarmentImageUrl: predictionRecord[0].sourceGarmentImageUrl,
              }
            },
            organizationId: organizationId,
            createdById: createdById,
            lastEditedById: createdById,
          }).returning();
        });

        await step.run("update-db-completed", async () => {
          return db.update(lookrPredictions)
            .set({ 
              status: "COMPLETED", 
              assetId: newAsset.id, // Link to the created asset
              errorMessage: null, 
              pollCount: currentPollCount,
              updatedAt: new Date() 
            })
            .where(eq(lookrPredictions.id, lookrPredictionDbId));
        });
        
        return { success: true, assetId: newAsset.id, finalStatus: "COMPLETED" };

      } else if (statusResponse.status === "failed" || statusResponse.error) {
        await step.run("update-db-failed", async () => {
          return db.update(lookrPredictions)
            .set({ status: "FAILED", errorMessage: statusResponse.error || 'Fashn.ai reported failure.', pollCount: currentPollCount, updatedAt: new Date() })
            .where(eq(lookrPredictions.id, lookrPredictionDbId));
        });
        return { error: "Fashn.ai prediction failed", details: statusResponse.error };

      } else if (statusResponse.status === "processing" || statusResponse.status === "pending") {
        // Still processing, schedule a retry/next poll
        await step.run("update-db-processing", async () => {
            return db.update(lookrPredictions)
              .set({ status: "PROCESSING", pollCount: currentPollCount, updatedAt: new Date() })
              .where(eq(lookrPredictions.id, lookrPredictionDbId));
          });

        await step.sleep("wait-for-next-poll", `${POLL_INTERVAL_SECONDS}s`);
        // Re-send the same event to trigger this function again for the next poll
        await step.sendEvent("re-poll-event", { name: "fashn.ai/prediction.poll", data: event.data });
        
        return { status: "Still processing, rescheduled poll." };
      } else {
        // Unknown status from Fashn.ai
        console.warn("Unknown Fashn.ai status:", statusResponse);
        await step.run("update-db-unknown-status", async () => {
          return db.update(lookrPredictions)
            .set({ status: "FAILED", errorMessage: `Unknown Fashn.ai status: ${statusResponse.status}`, pollCount: currentPollCount, updatedAt: new Date() })
            .where(eq(lookrPredictions.id, lookrPredictionDbId));
        });
        return { error: "Unknown Fashn.ai status", details: statusResponse };
      }

    } catch (error) {
      console.error("Error polling Fashn.ai status:", error);
      // If it's a FashnAIError, it might be a non-retryable client error
      // Otherwise, it could be a network issue, etc.
      // For simplicity, marking as FAILED, but could have more nuanced retry based on error type
      const errorMessage = error instanceof Error ? error.message : "Unknown polling error";
      await step.run("update-db-polling-error", async () => {
        return db.update(lookrPredictions)
          .set({ status: "FAILED", errorMessage: `Polling error: ${errorMessage}`, pollCount: currentPollCount, updatedAt: new Date() })
          .where(eq(lookrPredictions.id, lookrPredictionDbId));
      });
      // Depending on Inngest setup, this might be retried automatically by Inngest if it's an unhandled exception.
      // Here we are explicitly marking it as FAILED in DB.
      throw error; // Allow Inngest to handle retries for systemic errors if configured
    }
  }
);
