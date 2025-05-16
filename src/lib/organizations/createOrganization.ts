import { db } from "@/db";
import { onboardingDataSchema, organizations } from "@/db/schema/organization";
import { organizationMemberships } from "@/db/schema/organization-membership";
import { plans } from "@/db/schema/plans";
import { eq } from "drizzle-orm";
import { getZodDefaults } from "../utils";

export type CreateOrganizationInput = {
  name: string;
  userId: string;
};

export async function createOrganization({
  name,
  userId,
}: CreateOrganizationInput) {
  // Get the default plan
  const defaultPlan = await db
    .select()
    .from(plans)
    .where(eq(plans.default, true))
    .limit(1);

  // Generate a unique slug from the organization name
  const baseSlug = name.toLowerCase().replace(/ /g, "-");
  let slug = baseSlug;
  let counter = 1;

  // Keep checking until we find a unique slug
  while (true) {
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (existingOrg.length === 0) break;

    // If slug exists, append counter and try again
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  // Create the organization
  const [organization] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      planId: defaultPlan[0]?.id, // Set the default plan if one exists
      onboardingDone: false,
      onboardingData: getZodDefaults(onboardingDataSchema),
    })
    .returning();

  // Create owner membership for the user
  await db.insert(organizationMemberships).values({
    organizationId: organization.id,
    userId,
    role: "owner",
  });

  return organization;
}
