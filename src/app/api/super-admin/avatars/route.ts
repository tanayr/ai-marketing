import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { avatars } from "@/db/schema/avatars";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";

const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",") || [];

// Helper function to check if a user is a super admin
async function isSuperAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return SUPER_ADMIN_EMAILS.includes(session.user.email);
}

// GET /api/super-admin/avatars - Get all common avatars
export async function GET(req: NextRequest) {
  try {
    // Verify the user is a super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized - Only super admins can access this endpoint" },
        { status: 403 }
      );
    }

    // Get all avatars, common and non-common
    const allAvatars = await db.select().from(avatars).orderBy(avatars.createdAt);

    return NextResponse.json(allAvatars);
  } catch (error) {
    console.error("Error fetching avatars:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatars" },
      { status: 500 }
    );
  }
}

// Additional API routes for specific avatar operations can be implemented as needed
// These operations will be handled directly through the main avatar API routes
// with the isCommon flag, since the super admin can create avatars that are common
// to all organizations.
