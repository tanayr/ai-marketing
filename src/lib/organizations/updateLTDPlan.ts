import { db } from "@/db";
import { coupons } from "@/db/schema/coupons";
import { organizations } from "@/db/schema/organization";
import { plans } from "@/db/schema/plans";
import { eq, and, isNotNull, sql } from "drizzle-orm";

/**
 * Updates an organization's plan based on the number of redeemed coupons
 * 
 * @param organizationId - The ID of the organization to update
 * @returns The updated organization with plan information
 */
export async function updateLTDPlan(organizationId: string) {
  // Count valid redeemed coupons for this organization
  const redeemedCouponsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(coupons)
    .where(
      and(
        eq(coupons.organizationId, organizationId),
        isNotNull(coupons.usedAt),
        eq(coupons.expired, false)
      )
    )
    .then((result) => Number(result[0].count));

  // Find plans that require this number of coupons
  const eligiblePlans = await db
    .select()
    .from(plans)
    .where(eq(plans.requiredCouponCount, redeemedCouponsCount))
    .orderBy(plans.createdAt);

  // Find default plan as fallback
  const defaultPlan = await db
    .select()
    .from(plans)
    .where(eq(plans.default, true))
    .limit(1)
    .then((results) => results[0] || null);

  // Determine which plan to use
  const planToUse = eligiblePlans.length > 0 ? eligiblePlans[0] : defaultPlan;

  // Update the organization's plan
  await db
    .update(organizations)
    .set({ 
      planId: planToUse?.id || null,
      // If we have a plan, clear any stripe/lemon squeezy IDs since this is now LTD
      ...(planToUse && {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        lemonSqueezyCustomerId: null,
        lemonSqueezySubscriptionId: null,
      })
    })
    .where(eq(organizations.id, organizationId));

  // Get the updated organization
  const updatedOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)
    .then((results) => results[0]);

  // Get the current plan details
  const currentPlan = planToUse
    ? await db
        .select()
        .from(plans)
        .where(eq(plans.id, planToUse.id))
        .limit(1)
        .then((results) => results[0])
    : null;

  return {
    organization: updatedOrg,
    plan: currentPlan,
    couponCount: redeemedCouponsCount
  };
} 