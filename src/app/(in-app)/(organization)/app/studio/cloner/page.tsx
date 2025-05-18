"use client";

import ClonerStudio from "@/components/studio/cloner/cloner-studio";
import { Separator } from "@/components/ui/separator";

export default function ClonerStudioPage() {
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Cloner Studio</h1>
        <p className="text-muted-foreground">
          Upload an image and generate variations using AI
        </p>
      </div>
      
      <Separator className="mb-6" />
      
      <ClonerStudio />
    </div>
  );
}
