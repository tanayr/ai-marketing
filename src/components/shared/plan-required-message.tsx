"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import getSubscribeUrl, { PlanType, PlanProvider } from "@/lib/plans/getSubscribeUrl";

interface PlanRequiredMessageProps {
  title?: string;
  description?: string;
  planCodename: string;
  icon?: React.ReactNode;
  layout?: "card" | "fullpage";
}

export default function PlanRequiredMessage({
  title = "Subscription Required",
  description = "Please upgrade your plan to access this feature.",
  planCodename,
  icon = <Lock className="h-6 w-6" />,
  layout = "card",
}: PlanRequiredMessageProps) {
  // Generate the URL for the subscription page
  const subscribeUrl = getSubscribeUrl({
    codename: planCodename,
    type: PlanType.MONTHLY,
    provider: PlanProvider.STRIPE,
  });

  if (layout === "fullpage") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
          {icon}
        </div>
        
        <h2 className="text-2xl font-bold">{title}</h2>
        
        <p className="text-muted-foreground">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link href="/app">
            <Button variant="outline" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </Button>
          </Link>
          
          <Link href={subscribeUrl}>
            <Button>Upgrade Plan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-muted p-3">
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-2 pb-6">
        <Button variant="outline" asChild>
          <Link href="/app">Back to Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href={subscribeUrl}>Upgrade Plan</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
