import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import APIError from "../api/errors";
import { plans } from "@/db/schema/plans";

const updatePlan = async ({
  organizationId,
  newPlanId,
  sendEmail = true,
}: {
  organizationId: string;
  newPlanId: string;
  sendEmail?: boolean;
}) => {
  console.log("updatePlan", organizationId, newPlanId);
  
  // Update the organization's plan
  await db
    .update(organizations)
    .set({ planId: newPlanId })
    .where(eq(organizations.id, organizationId));

  if (sendEmail) {
    const plan = await db
      .select({ name: plans.name })
      .from(plans)
      .where(eq(plans.id, newPlanId))
      .limit(1)
      .then((res) => res[0]);

    if (!plan) {
      throw new APIError("Plan not found");
    }

    const planName = plan.name;
    console.log("planName", planName);

    // TODO: Implement this
  }
};

export default updatePlan;
