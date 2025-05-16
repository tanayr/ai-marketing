"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { InviteTableRowSkeleton } from "./InviteTableRowSkeleton";
import { useTeam } from "./TeamContext";

export function PendingInvites() {
  const { invitesData, isLoadingInvites, handleRevokeInvite, canManageTeam } = useTeam();

  if (!isLoadingInvites && (!invitesData?.invites || invitesData.invites.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invites</CardTitle>
        <CardDescription>
          Manage your pending team invitations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Expires</TableHead>
              {canManageTeam && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingInvites ? (
              <>
                <InviteTableRowSkeleton />
                <InviteTableRowSkeleton />
              </>
            ) : (
              invitesData?.invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{invite.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </TableCell>
                  {canManageTeam && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Revoke invite</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 