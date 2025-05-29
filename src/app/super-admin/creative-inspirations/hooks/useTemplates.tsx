"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  width: string;
  height: string;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/super-admin/templates");
        
        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }
        
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load templates");
        console.error("Error fetching templates:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  return { templates, isLoading, error };
}
