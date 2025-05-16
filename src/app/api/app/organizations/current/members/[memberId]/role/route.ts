import { OrganizationRole, organizationMemberships } from "@/db/schema";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { db } from "@/db";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { render } from "@react-email/components";
import RoleChangeEmail from "@/emails/RoleChangeEmail";
import sendMail from "@/lib/email/sendMail";
import { organizations } from "@/db/schema/organization";
import { users } from "@/db/schema/user";

const updateRoleSchema = z.object({
  role: z.enum([OrganizationRole.enum.user, OrganizationRole.enum.admin]),
});

export const PATCH = withOrganizationAuthRequired(async (req, context) => {
  const currentOrganization = await context.session.organization;
  const currentUser = await context.session.user;
  const params = await context.params;
  const memberId = params.memberId as string;

  // You cannot change your own role
  if (currentUser.id === memberId) {
    return NextResponse.json(
      { message: "You cannot change your own role", success: false },
      { status: 400 }
    );
  }

  try {
    const { role } = updateRoleSchema.parse(await req.json());

    // Check if the target member exists and is not the owner
    const targetMember = await db
      .select({
        userId: organizationMemberships.userId,
        role: organizationMemberships.role,
        email: users.email,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(
        and(
          eq(organizationMemberships.userId, memberId),
          eq(organizationMemberships.organizationId, currentOrganization.id)
        )
      )
      .limit(1)
      .then((members) => members[0]);

    if (!targetMember) {
      return NextResponse.json(
        { message: "Member not found", success: false },
        { status: 404 }
      );
    }

    if (targetMember.role === OrganizationRole.enum.owner) {
      return NextResponse.json(
        { message: "Cannot change owner's role", success: false },
        { status: 403 }
      );
    }

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

    // Update the role
    await db
      .update(organizationMemberships)
      .set({ role })
      .where(
        and(
          eq(organizationMemberships.userId, memberId),
          eq(organizationMemberships.organizationId, currentOrganization.id)
        )
      );

    // Send role change email
    const html = await render(
      RoleChangeEmail({
        workspaceName: org.name,
        newRole: role,
        changedByName: currentUser.name || "A team member",
      })
    );

    await sendMail(
      targetMember.email,
      `Your role has been updated in ${org.name}`,
      html
    );

    return NextResponse.json({
      message: "Role updated successfully",
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: error.message,
          success: false,
        },
        { status: 400 }
      );
    }

    console.error("Failed to update role:", error);
    return NextResponse.json(
      { message: "Failed to update role", success: false },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.admin);
