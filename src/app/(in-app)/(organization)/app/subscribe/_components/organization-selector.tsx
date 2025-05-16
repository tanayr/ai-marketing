"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useOrganization from "@/lib/organizations/useOrganization";
import { UserOrganization } from "@/lib/organizations/getUserOrganizations";
import { useRouter } from "next/navigation";

interface OrganizationSelectorProps {
  organizations: UserOrganization[];
}

export default function OrganizationSelector({
  organizations,
}: OrganizationSelectorProps) {
  const { switchOrganization } = useOrganization();
  const router = useRouter();

  const handleSelect = async (organizationId: string) => {
    await switchOrganization(organizationId);
    // Reload the page to continue with subscription
    router.refresh();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Organization</CardTitle>
        <CardDescription>
          Please select an organization to continue with the subscription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Button
              key={org.id}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleSelect(org.id)}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  Your role: {org.role}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 