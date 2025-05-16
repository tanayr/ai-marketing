"use client";

import React, { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useCurrentPlan from "@/lib/users/useCurrentPlan";
import AddStoreModal from "./_components/add-store-modal";
import PlanRequiredMessage from "@/components/shared/plan-required-message";
import StoresList from "./_components/stores-list";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function StoresPage() {
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const { currentPlan, isLoading } = useCurrentPlan();

  // Required plan for this feature
  const requiredPlanCodename = "monthly";

  // Check if user has access to this feature
  const hasAccess = currentPlan?.codename === requiredPlanCodename;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Store Management</h1>
        </div>
        
        {hasAccess && (
          <Button onClick={() => setIsAddStoreModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        )}
      </div>
      
      {hasAccess ? (
        <>
          <div className="grid gap-4">
            <StoresList />
          </div>
          
          <AddStoreModal 
            isOpen={isAddStoreModalOpen} 
            onClose={() => setIsAddStoreModalOpen(false)} 
          />
        </>
      ) : (
        <PlanRequiredMessage 
          title="Store Management Requires a Premium Plan" 
          description="Upgrade to our monthly plan to connect and manage your Shopify stores."
          planCodename={requiredPlanCodename}
        />
      )}
    </div>
  );
}
