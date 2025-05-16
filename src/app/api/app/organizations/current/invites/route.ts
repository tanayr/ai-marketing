import { OrganizationRole } from "@/db/schema";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { createInviteSchema } from "./schema";
import { db } from "@/db";
import { invitations } from "@/db/schema/invitation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { eq, and, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { render } from "@react-email/components";
import InvitationEmail from "@/emails/InvitationEmail";
import sendMail from "@/lib/email/sendMail";
import { appConfig } from "@/lib/config";
import { organizations } from "@/db/schema/organization";
import { organizationMemberships } from "@/db/schema/organization-membership";

// Get all invites for the current organization
export const GET = withOrganizationAuthRequired(async (req, context) => {
  const currentOrganization = await context.session.organization;

  try {
    const invites = await db
      .select()
      .from(invitations)
      .where(eq(invitations.organizationId, currentOrganization.id));

    return NextResponse.json({
      invites,
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch invites:", error);
    return NextResponse.json(
      { message: "Failed to fetch invites", success: false },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.admin);

// Create a new invite
export const POST = withOrganizationAuthRequired(async (req, context) => {
  const currentOrganization = await context.session.organization;
  const currentUser = await context.session.user;

  try {
    const { email, role } = createInviteSchema.parse(await req.json());

    // Check if this email already has a pending invite for this organization
    const existingInvite = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, currentOrganization.id),
          eq(invitations.email, email)
        )
      )
      .limit(1)
      .then((invites) => invites[0]);

    if (existingInvite) {
      return NextResponse.json(
        { 
          message: "This email already has a pending invitation",
          success: false 
        },
        { status: 400 }
      );
    }

    // Get current plan details and quotas
    const planDetails = currentOrganization.plan;
    
    if (!planDetails) {
      return NextResponse.json(
        { 
          message: "Organization has no active plan",
          success: false 
        },
        { status: 400 }
      );
    }

    // Calculate current and pending team members count
    const [currentMembersCount] = await db
      .select({ count: count() })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, currentOrganization.id));

    const [pendingInvitesCount] = await db
      .select({ count: count() })
      .from(invitations)
      .where(eq(invitations.organizationId, currentOrganization.id));

    const totalTeamCount = (currentMembersCount?.count || 0) + (pendingInvitesCount?.count || 0);
    // Check if adding one more would exceed the quota
    const teamMembersQuota = planDetails.quotas?.teamMembers;

    if (teamMembersQuota !== undefined && totalTeamCount >= teamMembersQuota) {
      return NextResponse.json(
        { 
          message: `You have reached your team members limit (${teamMembersQuota}). Please upgrade your plan to add more team members.`,
          success: false 
        },
        { status: 400 }
      );
    }

    const token = nanoid(32); // Generate a secure token for the invitation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await db
      .insert(invitations)
      .values({
        email,
        role,
        organizationId: currentOrganization.id,
        invitedById: currentUser.id,
        token,
        expiresAt,
      })
      .returning();

    // Get organization details
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, currentOrganization.id))
      .limit(1)
      .then((orgs) => orgs[0]);

    if (!org) {
      throw new Error("Organization not found");
    }

    // Generate accept URL
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/accept-invite?token=${token}`;

    // Send invitation email
    const html = await render(
      InvitationEmail({
        workspaceName: org.name,
        inviterName: currentUser.name || "A team member",
        role,
        acceptUrl,
        expiresAt,
      })
    );

    await sendMail(
      email,
      `Join ${org.name} on ${appConfig.projectName}`,
      html
    );

    return NextResponse.json({
      invite: invite[0],
      success: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: error.message,
          success: false,
        },
        { status: 400 }
      );
    }

    console.error("Failed to create invite:", error);
    return NextResponse.json(
      { message: "Failed to create invite", success: false },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.admin);