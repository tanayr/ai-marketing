import withAuthRequired from "@/lib/auth/withAuthRequired";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrganization } from "@/lib/organizations/createOrganization";
import { getUserOrganizations } from "@/lib/organizations/getUserOrganizations";

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
});

// Create an organization
export const POST = withAuthRequired(async (req, context) => {
  try {
    const { session } = context;
    const json = await req.json();
    const body = createOrganizationSchema.parse(json);
    const user = await session.user;

    const organization = await createOrganization({
      name: body.name,
      userId: user.id,
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
});

// Get my organizations
export const GET = withAuthRequired(async (req, context) => {
  const user = await context.session.user;

  const myOrganizations = await getUserOrganizations(user.id);

  return NextResponse.json(myOrganizations);
});
