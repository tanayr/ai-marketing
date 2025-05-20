import useSWR from "swr";
import { toast } from "sonner";
import { Asset } from "@/db/schema/assets";
import useOrganization from "@/lib/organizations/useOrganization";

export interface AssetFilter {
  type?: "image" | "video" | "content";
  status?: "draft" | "ready";
  studioTool?: string;
  search?: string;
}

/**
 * Hook for managing assets at the organization level
 */
export function useAssets(filters?: AssetFilter) {
  // Get current organization context
  const { organization, isLoading: orgLoading } = useOrganization();
  
  // Build the query string from filters
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.set("type", filters.type);
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.studioTool) queryParams.set("studioTool", filters.studioTool);
  if (filters?.search) queryParams.set("search", filters.search);
  
  // Only proceed with the request if we have an organization ID
  const organizationId = organization?.id;
  const shouldFetch = !!organizationId && !orgLoading;
  
  const queryString = queryParams.toString();
  const apiUrl = shouldFetch ? `/api/app/assets${queryString ? `?${queryString}` : ""}` : null;

  // Fetch assets with SWR - use array as cache key to include organization context
  const { data, error, isLoading: dataLoading, mutate } = useSWR<Asset[]>(
    shouldFetch ? [apiUrl, organizationId] : null,
    async ([url]) => {
      const response = await fetch(url, {
        headers: {
          'X-Organization-ID': organizationId || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    }
  );

  /**
   * Create a new asset
   */
  const createAsset = async (assetData: Partial<Asset>) => {
    return toast.promise(
      async () => {
        const response = await fetch("/api/app/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assetData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create asset");
        }

        await mutate();
        return await response.json();
      },
      {
        loading: "Creating asset...",
        success: "Asset created successfully",
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  /**
   * Update an existing asset
   */
  const updateAsset = async (id: string, assetData: Partial<Asset>) => {
    return toast.promise(
      async () => {
        const response = await fetch(`/api/app/assets/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assetData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update asset");
        }

        await mutate();
        return await response.json();
      },
      {
        loading: "Updating asset...",
        success: "Asset updated successfully",
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  /**
   * Delete an asset
   */
  const deleteAsset = async (id: string) => {
    return toast.promise(
      async () => {
        const response = await fetch(`/api/app/assets/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete asset");
        }

        await mutate();
        return await response.json();
      },
      {
        loading: "Deleting asset...",
        success: "Asset deleted successfully",
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  return {
    assets: data || [],
    isLoading: orgLoading || dataLoading,
    error,
    mutate,
    createAsset,
    updateAsset,
    deleteAsset,
    organizationId
  };
}

/**
 * Hook for managing a single asset
 */
export function useAsset(id: string) {
  // Get current organization context
  const { organization, isLoading: orgLoading } = useOrganization();
  const organizationId = organization?.id;
  const shouldFetch = !!id && !!organizationId && !orgLoading;
  
  const { data, error, isLoading: dataLoading, mutate } = useSWR<Asset>(
    shouldFetch ? [`/api/app/assets/${id}`, organizationId] : null,
    async ([url]) => {
      const response = await fetch(url, {
        headers: {
          'X-Organization-ID': organizationId || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch asset');
      return response.json();
    }
  );

  /**
   * Update this asset
   */
  const updateAsset = async (assetData: Partial<Asset>) => {
    return toast.promise(
      async () => {
        const response = await fetch(`/api/app/assets/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assetData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update asset");
        }

        await mutate();
        return await response.json();
      },
      {
        loading: "Updating asset...",
        success: "Asset updated successfully",
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  return {
    asset: data,
    isLoading: orgLoading || dataLoading,
    error,
    mutate,
    updateAsset,
    organizationId
  };
}
