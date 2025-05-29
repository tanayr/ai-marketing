"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface GenerationSettings {
  model: string;
  size: string;
  style: string;
  streamingEnabled?: boolean;
  partialImages?: number;
}

interface GenerationSettingsProps {
  settings: GenerationSettings;
  onChange: (settings: GenerationSettings) => void;
  className?: string;
}

export function GenerationSettings({
  settings,
  onChange,
  className,
}: GenerationSettingsProps) {
  const handleChange = (field: keyof GenerationSettings, value: string) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="model">Model</Label>
        <Select
          value={settings.model}
          onValueChange={(value) => handleChange("model", value)}
        >
          <SelectTrigger id="model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>OpenAI Models</SelectLabel>
              <SelectItem value="gpt-image-1">GPT-Image-1 (Best quality - no streaming)</SelectItem>
              <SelectItem value="gpt-4.1-mini">GPT-4.1-mini (Standard quality)</SelectItem>
              <SelectItem value="gpt-4.1">GPT-4.1 (High quality + streaming)</SelectItem>
              <SelectItem value="dall-e-3">DALL-E 3 (Legacy)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="size">Size</Label>
        <Select
          value={settings.size}
          onValueChange={(value) => handleChange("size", value)}
        >
          <SelectTrigger id="size">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Square</SelectLabel>
              <SelectItem value="1024x1024">1024 × 1024 (Standard)</SelectItem>
              
              {settings.model === "gpt-image-1" ? (
                <>
                  <SelectLabel>Other Sizes (GPT-Image-1)</SelectLabel>
                  <SelectItem value="1536x1024">1536 × 1024 (Landscape)</SelectItem>
                  <SelectItem value="1024x1536">1024 × 1536 (Portrait)</SelectItem>
                </>
              ) : (
                <>
                  <SelectLabel>Other Sizes (DALL-E 3)</SelectLabel>
                  <SelectItem value="1792x1024">1792 × 1024 (Landscape)</SelectItem>
                  <SelectItem value="1024x1792">1024 × 1792 (Portrait)</SelectItem>
                </>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {settings.model === "dall-e-3" && (
        <div>
          <Label htmlFor="style">Style</Label>
          <Select
            value={settings.style}
            onValueChange={(value) => handleChange("style", value)}
          >
            <SelectTrigger id="style">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vivid">Vivid (More striking colors)</SelectItem>
              <SelectItem value="natural">Natural (More subtle look)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Advanced Streaming Options - Only for gpt-4.1 */}
      {settings.model === "gpt-4.1" && (
        <div className="space-y-4 mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="streamingEnabled" className="mr-2">Enable Streaming</Label>
              <p className="text-xs text-muted-foreground">See generation progress in real-time</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="streamingEnabled"
                checked={settings.streamingEnabled}
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    streamingEnabled: e.target.checked
                  };
                  onChange(newSettings);
                }}
                className="mr-2 h-4 w-4"
              />
            </div>
          </div>
          
          <p className="text-xs text-amber-600 mt-1">
            Note: Streaming is only available with the gpt-4.1 model. When enabled, you'll see partial images as they're generated.
          </p>
          
          {settings.streamingEnabled && (
            <div>
              <Label htmlFor="partialImages">Partial Images</Label>
              <Select
                value={String(settings.partialImages || 2)}
                onValueChange={(value) => {
                  const newSettings = {
                    ...settings,
                    partialImages: parseInt(value)
                  };
                  onChange(newSettings);
                }}
              >
                <SelectTrigger id="partialImages">
                  <SelectValue placeholder="Number of partial images" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Faster)</SelectItem>
                  <SelectItem value="2">2 (Recommended)</SelectItem>
                  <SelectItem value="3">3 (More detail)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Number of intermediate images to show during generation</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
