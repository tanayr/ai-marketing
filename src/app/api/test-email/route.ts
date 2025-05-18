import { NextRequest, NextResponse } from "next/server";
import sendMail from "@/lib/email/sendMail";

export async function GET(req: NextRequest) {
  try {
    const testEmail = req.nextUrl.searchParams.get("email") || "test@example.com";
    
    await sendMail(
      testEmail,
      "Test Email from AI Marketing Suite",
      `
      <h1>This is a test email</h1>
      <p>If you're seeing this, the email configuration with Resend is working correctly!</p>
      <p>Time of test: ${new Date().toLocaleString()}</p>
      `
    );
    
    return NextResponse.json({ 
      success: true, 
      message: "Test email sent! Check your inbox or console logs if in development mode." 
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
