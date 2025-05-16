import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { createOrganization } from "./createOrganization";
import { eq } from "drizzle-orm";
import getOrCreateUser from "@/lib/users/getOrCreateUser";

/**
 * Gets or creates an organization associated with a Stripe customer
 * If an organization with the given Stripe customer ID exists, it returns that organization
 * If not, it creates a new organization for the user and associates it with the Stripe customer ID
 */
export const getOrCreateOrganizationByStripeCustomer = async ({
  stripeCustomerId,
  customerEmail,
  customerName,
}: {
  stripeCustomerId: string;
  customerEmail: string;
  customerName?: string | null;
}) => {
  // Check if an organization with this Stripe customer ID already exists
  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, stripeCustomerId))
    .limit(1)
    .then((res) => res[0]);

  if (existingOrg) {
    return {
      organization: existingOrg,
      created: false,
    };
  }

  // No organization found with this Stripe customer ID, so create one
  // First get or create the user
  const { user, created: userCreated } = await getOrCreateUser({
    emailId: customerEmail,
    name: customerName,
  });

  // Create a new organization for this user
  const orgName = customerName 
    ? `${customerName}'s Organization` 
    : `${customerEmail}'s Organization`;
    
  const organization = await createOrganization({
    name: orgName,
    userId: user.id,
  });

  // Update the organization with the Stripe customer ID
  const updatedOrg = await db
    .update(organizations)
    .set({
      stripeCustomerId: stripeCustomerId,
    })
    .where(eq(organizations.id, organization.id))
    .returning()
    .then((res) => res[0]);

  return {
    organization: updatedOrg,
    created: true,
    userCreated,
  };
};

export default getOrCreateOrganizationByStripeCustomer; 