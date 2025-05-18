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
              <SelectItem value="gpt-image-1">GPT-Image-1 (Best quality)</SelectItem>
              <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
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
    </div>
  );
}
