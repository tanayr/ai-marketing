// Accept an invite (no need to be authorized by any organization)

import { organizationMemberships } from "@/db/schema";
import withAuthRequired from "@/lib/auth/withAuthRequired";
import { db } from "@/db";
import { invitations } from "@/db/schema/invitation";
import { NextResponse } from "next/server";
import { and, eq, count } from "drizzle-orm";
import { organizations } from "@/db/schema/organization";
import { plans } from "@/db/schema/plans";

export const POST = withAuthRequired(async (req, context) => {
  const currentUser = await context.session.user;
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json(
      { message: "Invitation token is required", success: false },
      { status: 400 }
    );
  }

  try {
    // Find the invitation
    const invite = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.token, token)))
      .limit(1)
      .then((invites) => invites[0]);

    if (!invite) {
      return NextResponse.json(
        { message: "Invalid invitation", success: false },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json(
        { message: "Invitation has expired", success: false },
        { status: 400 }
      );
    }

    // Check if user's email matches the invitation
    if (invite.email.toLowerCase() !== currentUser.email?.toLowerCase()) {
      return NextResponse.json(
        {
          message: "This invitation is for a different email address",
          success: false,
        },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, currentUser.id),
          eq(organizationMemberships.organizationId, invite.organizationId)
        )
      )
      .limit(1)
      .then((memberships) => memberships[0]);

    if (existingMembership) {
      return NextResponse.json(
        {
          message: "You are already a member of this organization",
          success: false,
        },
        { status: 400 }
      );
    }

    // Get organization with its plan details
    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, invite.organizationId))
      .limit(1)
      .then((orgs) => orgs[0]);

    if (!organization) {
      return NextResponse.json(
        {
          message: "Organization not found",
          success: false,
        },
        { status: 404 }
      );
    }

    // Get the plan quotas
    if (organization.planId) {
      // Fetch current members count
      const [currentMembersCount] = await db
        .select({ count: count() })
        .from(organizationMemberships)
        .where(eq(organizationMemberships.organizationId, invite.organizationId));

      // Fetch the plan to check quotas
      const plan = await db
        .select()
        .from(plans)
        .where(eq(plans.id, organization.planId))
        .limit(1)
        .then((results) => results[0]);

      if (plan && plan.quotas) {
        const teamMembersQuota = plan.quotas.teamMembers;
        
        if (teamMembersQuota !== undefined && (currentMembersCount?.count || 0) >= teamMembersQuota) {
          // Delete this invitation since the team is already at quota
          await db.delete(invitations).where(eq(invitations.id, invite.id));
          
          return NextResponse.json(
            {
              message: `This organization has reached its team members limit (${teamMembersQuota}). The administrator will need to upgrade the plan or remove existing members.`,
              success: false,
            },
            { status: 400 }
          );
        }
      }
    }

    // Create membership and delete invitation
    await db.insert(organizationMemberships).values({
      userId: currentUser.id,
      organizationId: invite.organizationId,
      role: invite.role,
    });

    await db.delete(invitations).where(eq(invitations.id, invite.id));

    return NextResponse.json({
      organizationId: invite.organizationId,
      success: true,
    });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { message: "Failed to accept invitation", success: false },
      { status: 500 }
    );
  }
});
