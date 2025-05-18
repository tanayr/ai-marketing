"use client";

import { useState } from "react";
import { useFileUpload } from "@/lib/uploads/useFileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface UrlInputProps {
  onFileUploaded: (fileUrl: string) => void;
  path?: string;
  className?: string;
  placeholder?: string;
}

export function UrlInput({
  onFileUploaded,
  path = "uploads/from-url",
  className,
  placeholder = "Enter image URL..."
}: UrlInputProps) {
  const [url, setUrl] = useState("");
  const { uploadFromUrl, isUploading, error } = useFileUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) return;
    
    try {
      const result = await uploadFromUrl(url, { path });
      onFileUploaded(result.url);
      setUrl("");
    } catch (err) {
      // Error handling is done in useFileUpload
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <div className="flex gap-2">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          disabled={isUploading}
          className="flex-1"
        />
        <Button type="submit" disabled={!url || isUploading}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isUploading ? "Loading..." : "Upload"}
        </Button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">
          {error.message}
        </p>
      )}
    </form>
  );
}
