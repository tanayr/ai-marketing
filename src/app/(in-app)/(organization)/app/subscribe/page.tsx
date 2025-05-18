import { auth } from "@/auth";
import { db } from "@/db";
import { plans } from "@/db/schema/plans";
import { createCheckoutSession, createCustomer } from "@/lib/lemonsqueezy";
import { createOneTimePaymentCheckout, createSubscriptionCheckout } from "@/lib/dodopayments";
import {
  PlanProvider,
  PlanType,
  subscribeParams,
  SubscribeParams,
} from "@/lib/plans/getSubscribeUrl";
import stripe from "@/lib/stripe";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import React from "react";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { organizations } from "@/db/schema/organization";
import { organizationMemberships } from "@/db/schema/organization-membership";
import { OrganizationRole } from "@/db/schema";
import OrganizationSelector from "./_components/organization-selector";
import { getUserOrganizations } from "@/lib/organizations/getUserOrganizations";

async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<SubscribeParams>;
}) {
  const { codename, type, provider, trialPeriodDays } = await searchParams;

  try {
    subscribeParams.parse({
      codename,
      type,
      provider,
      trialPeriodDays: trialPeriodDays ? Number(trialPeriodDays) : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/error?code=INVALID_PARAMS&message=${error.message}`
      );
    }
    throw error;
  }

  const session = await auth();

  if (!session?.user?.email) {
    return redirect("/auth/login");
  }

  // Get current session to check for organization
  const currentSession = await getSession();
  const currentOrganizationId = currentSession.currentOrganizationId;

  let currentOrganization;
  if (currentOrganizationId) {
    // Verify if user is part of this organization and has admin/owner role
    const membership = await db
      .select({
        role: organizationMemberships.role,
      })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, currentOrganizationId),
          eq(organizationMemberships.userId, session.user.id)
        )
      )
      .limit(1)
      .then((memberships) => memberships[0]);

    if (
      membership &&
      (membership.role === OrganizationRole.enum.admin ||
        membership.role === OrganizationRole.enum.owner)
    ) {
      currentOrganization = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, currentOrganizationId))
        .limit(1)
        .then((orgs) => orgs[0]);
    }
  }

  if (!currentOrganization) {
    // Get all organizations where user is admin or owner
    const userOrgs = await getUserOrganizations(session.user.id);
    const adminOrgs = userOrgs.filter(
      (org) =>
        org.role === OrganizationRole.enum.admin ||
        org.role === OrganizationRole.enum.owner
    );

    if (adminOrgs.length === 0) {
      return redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/error?code=NO_ADMIN_ACCESS`
      );
    }

    if (adminOrgs.length === 1) {
      currentOrganization = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, adminOrgs[0].id))
        .limit(1)
        .then((orgs) => orgs[0]);
    } else {
      // Show organization selector
      return <OrganizationSelector organizations={adminOrgs} />;
    }
  }

  if (!currentOrganization) {
    throw new Error("Organization not found");
  }

  // Get the plan
  const plansList = await db
    .select()
    .from(plans)
    .where(eq(plans.codename, codename))
    .limit(1);

  if (!plansList?.[0]) {
    return notFound();
  }

  const plan = plansList[0];

  // Force all requests to use Dodo payment provider in test mode
  if (provider !== PlanProvider.DODO) {
    return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe?codename=${codename}&type=${type}&provider=${PlanProvider.DODO}&trialPeriodDays=${trialPeriodDays}`);
  }

  // Comment out cases that we don't want to use in test mode
  switch (provider) {
    /* Disabling Stripe in test mode
    case PlanProvider.STRIPE:
      // Check type and get price id from db
      const key: keyof typeof plan | null =
        type === PlanType.MONTHLY
          ? "monthlyStripePriceId"
          : type === PlanType.YEARLY
            ? "yearlyStripePriceId"
            : type === PlanType.ONETIME
              ? "onetimeStripePriceId"
              : null;

      if (!key) {
        return notFound();
      }
      const priceId = plan[key];
      if (!priceId) {
        return notFound();
      }

      // Check if existing subscription for this organization
      if (currentOrganization.stripeSubscriptionId) {
        // If this is onetime plan then redirect to error page with message to
        // cancel existing subscription
        if (type === PlanType.ONETIME) {
          return redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/error?code=STRIPE_CANCEL_BEFORE_SUBSCRIBING`
          );
        }
        // If this is monthly or yearly plan then redirect to billing page
        return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/billing`);
      }

      // Get or create Stripe customer
      let stripeCustomerId = currentOrganization.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: currentOrganization.name,
          metadata: {
            organizationId: currentOrganization.id,
          },
        });
        stripeCustomerId = customer.id;

        // Update organization with Stripe customer ID
        await db
          .update(organizations)
          .set({ stripeCustomerId })
          .where(eq(organizations.id, currentOrganization.id));
      }

      // Create checkout session
      const stripeCheckoutSession = await stripe.checkout.sessions.create({
        mode: type === PlanType.ONETIME ? "payment" : "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: trialPeriodDays
          ? {
              trial_period_days: trialPeriodDays,
            }
          : undefined,
        customer: stripeCustomerId,
        billing_address_collection: "required",
        customer_update: {
          name: "auto",
          address: "auto",
          shipping: "auto",
        },
        tax_id_collection: {
          enabled: true,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/success?provider=${provider}&codename=${codename}&type=${type}&sessionId={CHECKOUT_SESSION_ID}&trialPeriodDays=${trialPeriodDays}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/cancel?provider=${provider}&codename=${codename}&type=${type}&sessionId={CHECKOUT_SESSION_ID}&trialPeriodDays=${trialPeriodDays}`,
      });

      if (!stripeCheckoutSession.url) {
        throw new Error("Checkout session URL not found");
      }
      return redirect(stripeCheckoutSession.url);
    */

    /* Disabling LemonSqueezy in test mode
    case PlanProvider.LEMON_SQUEEZY:
      const lemonsqueezyKey: keyof typeof plan | null =
        type === PlanType.MONTHLY
          ? "monthlyLemonSqueezyVariantId"
          : type === PlanType.YEARLY
            ? "yearlyLemonSqueezyVariantId"
            : type === PlanType.ONETIME
              ? "onetimeLemonSqueezyVariantId"
              : null;

      if (!lemonsqueezyKey) {
        return notFound();
      }
      const lemonsqueezyVariantId = plan[lemonsqueezyKey];
      if (!lemonsqueezyVariantId) {
        return notFound();
      }

      // Check if existing subscription for this organization
      if (currentOrganization.lemonSqueezySubscriptionId) {
        // If this is onetime plan then redirect to error page with message to
        // cancel existing subscription
        if (type === PlanType.ONETIME) {
          return redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/error?code=LEMON_SQUEEZY_CANCEL_BEFORE_SUBSCRIBING`
          );
        }
        // If this is monthly or yearly plan then redirect to billing page
        return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/billing`);
      }

      // Get or create LemonSqueezy customer
      let lemonSqueezyCustomerId = currentOrganization.lemonSqueezyCustomerId;
      if (!lemonSqueezyCustomerId) {
        const customer = await createCustomer({
          name: currentOrganization.name,
          email: session.user.email,
          metadata: {
            organizationId: currentOrganization.id,
          },
        });
        lemonSqueezyCustomerId = customer.data.id;

        // Update organization with LemonSqueezy customer ID
        await db
          .update(organizations)
          .set({ lemonSqueezyCustomerId })
          .where(eq(organizations.id, currentOrganization.id));
      }

      const checkoutSession = await createCheckoutSession({
        variantId: lemonsqueezyVariantId,
        customerEmail: session.user.email,
        customerId: lemonSqueezyCustomerId,
      });

      if (!checkoutSession.data.url) {
        throw new Error("Checkout session URL not found");
      }
      return redirect(checkoutSession.data.url);
    */
    case PlanProvider.DODO:
      const dodoKey: keyof typeof plan | null =
        type === PlanType.MONTHLY
          ? "monthlyDodoProductId"
          : type === PlanType.YEARLY
            ? "yearlyDodoProductId"
            : type === PlanType.ONETIME
              ? "onetimeDodoProductId"
              : null;

      if (!dodoKey) {
        return notFound();
      }
      const dodoProductId = plan[dodoKey];
      if (!dodoProductId) {
        return notFound();
      }

      // Check if existing subscription for this organization
      if (currentOrganization.dodoSubscriptionId) {
        // If this is onetime plan then redirect to error page with message to
        // cancel existing subscription
        if (type === PlanType.ONETIME) {
          return redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/error?code=DODO_CANCEL_BEFORE_SUBSCRIBING`
          );
        }
        // If this is monthly or yearly plan then redirect to billing page
        return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/billing`);
      }

      // Get or create Dodo customer
      let dodoCustomerId = currentOrganization.dodoCustomerId || undefined;
      
      // Define basic billing info - in a production app, you'd collect this from the user
      const defaultBillingInfo = {
        country: "US", // Default country
        state: "CA",
        city: "San Francisco",
        street: "123 Main St",
        zipcode: "94105"
      };

      try {
        if (type === PlanType.ONETIME) {
          // Create one-time payment checkout
          const checkout = await createOneTimePaymentCheckout({
            productId: dodoProductId,
            customerEmail: session.user.email,
            customerId: dodoCustomerId,
            billing: defaultBillingInfo,
            organizationName: currentOrganization.name,
            codename,
            type,
          });

          if (!checkout.payment_link) {
            throw new Error("Checkout payment link not found");
          }

          // If a new customer was created, update the organization
          if (checkout.payment_id && !dodoCustomerId) {
            await db
              .update(organizations)
              .set({ dodoCustomerId: checkout.payment_id })
              .where(eq(organizations.id, currentOrganization.id));
          }

          return redirect(checkout.payment_link);
        } else {
          // Create subscription checkout
          const checkout = await createSubscriptionCheckout({
            productId: dodoProductId,
            customerEmail: session.user.email,
            customerId: dodoCustomerId,
            trialPeriodDays: trialPeriodDays ? Number(trialPeriodDays) : undefined,
            billing: defaultBillingInfo,
            organizationName: currentOrganization.name,
            codename,
            type,
          });

          if (!checkout.payment_link) {
            throw new Error("Checkout payment link not found");
          }

          // If a new customer was created, update the organization
          if (checkout.payment_id && !dodoCustomerId) {
            await db
              .update(organizations)
              .set({ dodoCustomerId: checkout.payment_id })
              .where(eq(organizations.id, currentOrganization.id));
          }

          return redirect(checkout.payment_link);
        }
      } catch (error) {
        console.error("Dodo checkout error:", error);
        throw new Error("Failed to create Dodo checkout session");
      }

    default:
      return <div>Provider not found</div>;
  }
}

export default SubscribePage;
