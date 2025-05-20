import useSWR from 'swr';
import { Avatar } from '../types';
import useOrganization from '@/lib/organizations/useOrganization';
import { toast } from 'sonner';

/**
 * Hook for fetching and managing avatars
 */
export function useAvatars() {
  // Get current organization context
  const { organization, isLoading: orgLoading } = useOrganization();
  
  // Only proceed with the request if we have an organization ID
  const organizationId = organization?.id;
  const shouldFetch = !!organizationId && !orgLoading;
  
  const { data, error, isLoading: dataLoading, mutate } = useSWR<Avatar[]>(
    shouldFetch ? [`/api/app/studio/lookr/avatars`, organizationId] : null,
    async ([url]) => {
      const response = await fetch(url, {
        headers: {
          'X-Organization-ID': organizationId || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch avatars');
      return response.json();
    }
  );

  /**
   * Create a new avatar
   */
  const createAvatar = async (avatarData: Omit<Avatar, 'id'>) => {
    return toast.promise(
      async () => {
        const response = await fetch("/api/app/studio/lookr/avatars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'X-Organization-ID': organizationId || ''
          },
          body: JSON.stringify(avatarData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create avatar");
        }

        await mutate();
        return await response.json();
      },
      {
        loading: "Creating avatar...",
        success: "Avatar created successfully",
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  /**
   * Update an existing avatar
   */
  const updateAvatar = async (id: string, avatarData: Partial<Avatar>) => {
    return toast.promise(
      async () => {
        const response = await fetch(`/api/app/studio/lookr/avatars/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'X-Organization-ID': organizationId || ''
          },
          body: JSON.stringify(avatarData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update avatar");
        }

        await mutate();
        return await response.json();
      },
      {
        loading: "Updating avatar...",
        success: "Avatar updated successfully",
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  /**
   * Delete an avatar
   */
  const deleteAvatar = async (id: string) => {
    return toast.promise(
      async () => {
        const response = await fetch(`/api/app/studio/lookr/avatars/${id}`, {
          method: "DELETE",
          headers: {
            'X-Organization-ID': organizationId || ''
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete avatar");
        }

        await mutate();
        return await response.json();
      },
      {
        loading: "Deleting avatar...",
        success: "Avatar deleted successfully",
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  return {
    avatars: data || [],
    isLoading: orgLoading || dataLoading,
    error,
    mutate,
    createAvatar,
    updateAvatar,
    deleteAvatar,
    organizationId
  };
}
