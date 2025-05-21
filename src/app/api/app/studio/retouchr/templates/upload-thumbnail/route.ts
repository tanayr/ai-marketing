import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/s3/uploadFile";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";

/**
 * API endpoint for uploading template thumbnails to S3
 * Takes a dataUrl and converts it to a buffer before uploading to S3
 */
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    // Get dataUrl, filename, and isCommon flag from request body
    const { dataUrl, filename, isCommon = false } = await req.json();
    
    if (!dataUrl) {
      return NextResponse.json(
        { error: "No thumbnail data provided" },
        { status: 400 }
      );
    }
    
    // If this is a common template, verify the user is a super admin
    if (isCommon) {
      const user = await context.session.user;
      const email = user.email;
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super administrators can create common templates" },
          { status: 403 }
        );
      }
    }
    
    // Strip the "data:image/png;base64," part and get just the base64 data
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");
    
    // Set content type based on data URL
    const contentType = dataUrl.match(/^data:(.*?);/)?.[1] || "image/png";
    
    // Generate a safe filename if not provided
    const safeFilename = filename || `template-${Date.now()}.png`;
    
    // Upload to S3
    const result = await uploadFile(
      buffer,
      contentType,
      "templates/thumbnails", // Folder path in S3
      safeFilename
    );
    
    // Return the URL
    return NextResponse.json({
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error("Error uploading template thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    );
  }
}, "user"); // Any organization member can upload thumbnails
