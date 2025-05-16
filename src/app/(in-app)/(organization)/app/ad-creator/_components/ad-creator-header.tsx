"use client";

import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdCreatorHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/app">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">AI Ad Creator</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Generate high-converting ad copy for different platforms using AI. Select your platform, 
          enter your product details, and our AI will create compelling ad variations for your campaigns.
        </p>
      </div>
    </div>
  );
}
