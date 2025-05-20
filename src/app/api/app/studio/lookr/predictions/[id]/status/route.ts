import { NextResponse } from "next/server";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { FashnAIClient } from "@/lib/external-api/fashn-ai-client";

// Get the prediction status
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const params = await context.params;
    const id = params.id as string;
    
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
    
    // Make the API call to get the prediction status
    const status = await fashnAIClient.getPredictionStatus(id);
    
    return NextResponse.json(status);
    
  } catch (error) {
    console.error("Error getting prediction status:", error);
    
    return NextResponse.json(
      { error: "Failed to get prediction status" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can check prediction status
