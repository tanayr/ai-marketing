"use client";
import React from "react";
import useCurrentPlan from "@/lib/users/useCurrentPlan";
import { Button } from "@/components/ui/button";
import { CreditCardIcon, Store, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { AIAdsGeneratorCard } from "@/components/in-app/ai-ads-generator-card";

function AppHomepage() {
  const { currentPlan } = useCurrentPlan();
  const isMonthlyPlan = currentPlan?.codename === "monthly";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentPlan
            ? `You are on the ${currentPlan.name} plan.`
            : "You are not subscribed to any plan."}
        </p>
      </div>

      {/* Plan management button */}
      <div>
        {!currentPlan || currentPlan.default ? (
          <Link href="/#pricing">
            <Button>
              <CreditCardIcon className="w-4 h-4 mr-2" />
              <span>Subscribe</span>
            </Button>
          </Link>
        ) : (
          <Link href="/app/billing">
            <Button>
              <CreditCardIcon className="w-4 h-4 mr-2" />
              <span>Manage Subscription</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Features section - conditionally rendered based on plan */}
      {isMonthlyPlan && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">AI Marketing Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AIAdsGeneratorCard />
            
            {/* Stores Management Card */}
            <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Shopify Stores</h3>
                </div>
              </div>
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect and manage your Shopify stores. Sync products and generate AI-powered marketing materials.
                </p>
                <Link href="/app/stores">
                  <Button className="w-full">
                    <Store className="mr-2 h-4 w-4" />
                    Manage Stores
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Products Management Card */}
            <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Product Catalog</h3>
                </div>
              </div>
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Browse, search and manage your product catalog. Optimize product descriptions and marketing details.
                </p>
                <Link href="/app/stores">
                  <Button className="w-full">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Manage Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug information - only visible during development */}
      {process.env.NODE_ENV === "development" && currentPlan && (
        <div className="mt-8 p-4 border rounded bg-muted/20">
          <h3 className="text-sm font-medium mb-2">Debug Information</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify({ currentPlan }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default AppHomepage;
