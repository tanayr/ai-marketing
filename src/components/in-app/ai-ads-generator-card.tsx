"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export function AIAdsGeneratorCard() {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Ads Generator</CardTitle>
        </div>
        <CardDescription>
          Create high-converting ad copy for your marketing campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-0">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 p-1">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <span>Generate social media ad copy</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 p-1">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <span>Create Google and Meta ad variations</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 p-1">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <span>Optimize for conversions</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="pt-4 pb-4">
        <Link href="/app/ad-creator" className="w-full">
          <Button className="w-full">
            <span>Create Ads</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
