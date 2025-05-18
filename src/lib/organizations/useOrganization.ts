import useSWR from "swr";
import { UserOrganizationWithPlan } from "./getUserOrganizations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

const useOrganization = () => {
  const router = useRouter();
  const { data, isLoading, error, mutate } = useSWR<UserOrganizationWithPlan>(
    "/api/app/organizations/current"
  );
  
  // Define switchOrganization with useCallback to prevent recreation on each render
  const switchOrganization = useCallback(async (organizationId: string, showToast = true) => {
    try {
      if (showToast) {
        return toast.promise(
          async () => {
            const response = await fetch("/api/app/organizations/current", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ organizationId }),
            });

            if (!response.ok) {
              throw new Error("Failed to switch organization");
            }
            await mutate();
            router.push("/app");
            return true;
          },
          {
            loading: "Switching organization...",
            success: "Organization switched successfully",
            error: "Failed to switch organization",
          }
        );
      } else {
        // Silent version without toast
        const response = await fetch("/api/app/organizations/current", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ organizationId }),
        });

        if (!response.ok) {
          throw new Error("Failed to switch organization");
        }
        await mutate();
        return true;
      }
    } catch (error) {
      console.error("Failed to switch organization:", error);
      return false;
    }
  }, [mutate, router]);
  
  // Add effect to automatically set an organization if none is selected
  useEffect(() => {
    const setDefaultOrganization = async () => {
      if (error && !isLoading) {
        try {
          // Fetch available organizations
          const orgsResponse = await fetch("/api/app/organizations");
          const organizations = await orgsResponse.json();
          
          // If user has organizations, set the first one as current
          if (organizations && organizations.length > 0) {
            // Use false to avoid showing toast when auto-selecting
            await switchOrganization(organizations[0].id, false);
          }
        } catch (err) {
          console.error("Failed to set default organization:", err);
        }
      }
    };
    
    setDefaultOrganization();
  }, [error, isLoading, switchOrganization]);

  // switchOrganization is now defined above with useCallback

  return {
    organization: data,
    isLoading,
    error,
    mutate,
    switchOrganization,
  };
};

export default useOrganization;
