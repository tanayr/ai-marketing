import { db } from "@/db";
import { plans } from "@/db/schema/plans";
import { organizations } from "@/db/schema/organization";
import { eq } from "drizzle-orm";
import updatePlan from "./updatePlan";

const downgradeToDefaultPlan = async ({
  organizationId,
}: {
  organizationId: string;
}) => {
  // Find the default plan
  const defaultPlan = await db
    .select()
    .from(plans)
    .where(eq(plans.default, true))
    .limit(1)
    .then((res) => res[0]);

  if (!defaultPlan) {
    console.error("No default plan found");
    return;
  }

  // Update the organization to the default plan
  await updatePlan({
    organizationId,
    newPlanId: defaultPlan.id,
    sendEmail: true,
  });

  // Reset subscription IDs in the organization
  await db
    .update(organizations)
    .set({ 
      stripeSubscriptionId: null, 
      lemonSqueezySubscriptionId: null 
    })
    .where(eq(organizations.id, organizationId));
};

export default downgradeToDefaultPlan;
