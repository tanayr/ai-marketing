"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useCurrentPlan from "@/lib/users/useCurrentPlan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/in-app/page-loader";
import AdCreatorHeader from "./_components/ad-creator-header";
import SocialMediaAdForm from "./_components/social-media-ad-form";
import GoogleAdForm from "./_components/google-ad-form";
import PlanRequiredMessage from "@/components/shared/plan-required-message";

export default function AdCreatorPage() {
  const router = useRouter();
  const { currentPlan, isLoading } = useCurrentPlan();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      // Check if user has monthly plan or higher
      const hasPlanAccess = currentPlan?.codename === "monthly";
      setHasAccess(hasPlanAccess);

      // If not on monthly plan, redirect after a brief delay to show the message
      if (!hasPlanAccess) {
        const redirectTimer = setTimeout(() => {
          router.push("/app");
        }, 3000);

        return () => clearTimeout(redirectTimer);
      }
    }
  }, [currentPlan, isLoading, router]);

  // Show loading state while checking plan
  if (isLoading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoader />
      </div>
    );
  }

  // Show message if user doesn't have access
  if (!hasAccess) {
    return <PlanRequiredMessage
      title="Ad Creator Requires a Premium Plan"
      description="The AI Ad Creator requires a monthly subscription plan."
      planCodename="monthly"
      layout="fullpage"
    />;
  }

  // User has access, show the main content
  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-8">
      <AdCreatorHeader />
      
      <Tabs defaultValue="social" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="social">Social Media Ads</TabsTrigger>
          <TabsTrigger value="google">Google Ads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="social" className="mt-6">
          <SocialMediaAdForm />
        </TabsContent>
        
        <TabsContent value="google" className="mt-6">
          <GoogleAdForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
