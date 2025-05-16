"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";
import { useTeam, PendingInvites, TeamMembers, InviteDialog, RevokeInviteDialog, ChangeRoleDialog, RemoveMemberDialog } from "./";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TeamContent() {
  const {
    setIsInviteDialogOpen,
    canManageTeam
  } = useTeam();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their roles.
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {!canManageTeam && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need admin or owner permissions to manage team members. You can view the team but cannot make changes.
          </AlertDescription>
        </Alert>
      )}

      <PendingInvites />
      <TeamMembers />
      <InviteDialog />
      <RevokeInviteDialog />
      <ChangeRoleDialog />
      <RemoveMemberDialog />
    </div>
  );
} 