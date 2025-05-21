import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];

// Helper function to check if a user is a super admin
async function isSuperAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return SUPER_ADMIN_EMAILS.includes(session.user.email);
}

// GET /api/super-admin/check-access - Check if user is a super admin
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await isSuperAdmin();
    
    if (isAdmin) {
      // User is a super admin
      return NextResponse.json({ 
        isAdmin: true,
        message: "User has super admin access" 
      });
    } else {
      // User is not a super admin but we return 200 with isAdmin: false
      // This helps the frontend distinguish between auth errors and access checks
      return NextResponse.json({ 
        isAdmin: false,
        message: "User does not have super admin access" 
      });
    }
  } catch (error) {
    console.error("Error checking super admin status:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}
