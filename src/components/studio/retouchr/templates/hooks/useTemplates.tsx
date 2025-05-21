"use client";

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { Template } from '@/db/schema/templates';
import { toast } from 'sonner';

export interface UseTemplatesOptions {
  onSuccess?: (data: Template[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for fetching and managing templates
 */
export const useTemplates = (options?: UseTemplatesOptions) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all templates (both common and org-specific)
  const { 
    data: templates, 
    error, 
    mutate: refreshTemplates,
    isLoading 
  } = useSWR<Template[]>(
    '/api/app/studio/retouchr/templates',
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch templates');
      }
      const data = await response.json();
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
      return data;
    },
    {
      onError: (err) => {
        console.error('Error fetching templates:', err);
        if (options?.onError) {
          options.onError(err);
        }
      },
      revalidateOnFocus: false,
    }
  );

  // Create a new template
  const createTemplate = useCallback(async (templateData: Partial<Template>) => {
    try {
      setIsCreating(true);
      
      const response = await fetch('/api/app/studio/retouchr/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      const createdTemplate = await response.json();
      await refreshTemplates();
      toast.success('Template created successfully');
      
      return createdTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [refreshTemplates]);

  // Update an existing template
  const updateTemplate = useCallback(async (id: string, templateData: Partial<Template>) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/app/studio/retouchr/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }

      const updatedTemplate = await response.json();
      await refreshTemplates();
      toast.success('Template updated successfully');
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [refreshTemplates]);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/app/studio/retouchr/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      await refreshTemplates();
      toast.success('Template deleted successfully');
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [refreshTemplates]);

  // Get a specific template by ID
  const getTemplate = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/app/studio/retouchr/templates/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      throw error;
    }
  }, []);

  return {
    templates,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    refreshTemplates,
  };
};
