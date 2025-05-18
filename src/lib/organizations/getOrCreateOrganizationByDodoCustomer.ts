import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { eq, and, isNull } from "drizzle-orm";
import type { Organization } from "@/db/schema/organization";

/**
 * Get or create an organization by Dodo customer ID
 * This is used when handling webhooks from Dodo
 */
export async function getOrCreateOrganizationByDodoCustomer(
  dodoCustomerId: string,
  email?: string
): Promise<Organization | null> {
  try {
    // First, try to find an existing organization with this Dodo customer ID
    const existingOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.dodoCustomerId, dodoCustomerId));

    // If found, return the first matching organization
    if (existingOrgs.length > 0) {
      return existingOrgs[0];
    }

    // If we have an email, try to find organization by email without a Dodo customer ID
    if (email) {
      // For organizations that were created with an email but don't have a Dodo customer ID yet
      // This requires that you store user emails in organization somewhere, or link to users table
      // This is just a placeholder implementation - you'll need to adapt this to your data model
      
      // Example: look for organizations with matching name (if you store email as name)
      // or you could join with users table to find organizations where a user has this email
      const orgsWithoutDodo = await db
        .select()
        .from(organizations)
        .where(
          and(
            eq(organizations.name, email), // This is just an example - adjust to your data model
            isNull(organizations.dodoCustomerId)
          )
        );

      if (orgsWithoutDodo.length > 0) {
        // Update the organization with the Dodo customer ID
        const [updatedOrg] = await db
          .update(organizations)
          .set({
            dodoCustomerId: dodoCustomerId,
          })
          .where(eq(organizations.id, orgsWithoutDodo[0].id))
          .returning();

        return updatedOrg;
      }
    }

    // No matching organization found
    // In a production system, you might want to create a new organization here
    // with a default plan, but for now we'll return null
    console.log(`No organization found for Dodo customer ID: ${dodoCustomerId}`);
    return null;
  } catch (error) {
    console.error("Error in getOrCreateOrganizationByDodoCustomer:", error);
    return null;
  }
}
