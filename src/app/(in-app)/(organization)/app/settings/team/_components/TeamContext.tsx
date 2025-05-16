"use client";

import { CreateInviteSchema, createInviteSchema } from "@/app/api/app/organizations/current/invites/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, ReactNode, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { InvitesResponse, Member, MembersResponse } from "./types";
import useOrganization from "@/lib/organizations/useOrganization";

interface TeamContextType {
  // Data and loading states
  invitesData: InvitesResponse | undefined;
  membersData: MembersResponse | undefined;
  isLoadingInvites: boolean;
  isLoadingMembers: boolean;
  mutateInvites: () => Promise<InvitesResponse | undefined>;
  mutateMembers: () => Promise<MembersResponse | undefined>;
  
  // Dialog states
  isInviteDialogOpen: boolean;
  setIsInviteDialogOpen: (open: boolean) => void;
  isRevokeDialogOpen: boolean;
  setIsRevokeDialogOpen: (open: boolean) => void;
  isChangeRoleDialogOpen: boolean;
  setIsChangeRoleDialogOpen: (open: boolean) => void;
  isRemoveMemberDialogOpen: boolean;
  setIsRemoveMemberDialogOpen: (open: boolean) => void;
  
  // Selected item states
  selectedInviteId: string | null;
  setSelectedInviteId: (id: string | null) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  
  // Forms
  inviteForm: ReturnType<typeof useForm<CreateInviteSchema>>;
  roleForm: ReturnType<typeof useForm<{ role: "user" | "admin" }>>;
  
  // Actions
  onInviteSubmit: (values: CreateInviteSchema) => Promise<void>;
  onRevokeInvite: () => Promise<void>;
  onChangeRole: (values: { role: "user" | "admin" }) => Promise<void>;
  onRemoveMember: () => Promise<void>;
  handleRoleChange: (member: Member) => void;
  handleRemoveMember: (member: Member) => void;
  handleRevokeInvite: (inviteId: string) => void;
  
  // Permissions
  canManageTeam: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  // Get organization data to check user's role
  const { organization } = useOrganization();
  
  // Determine if user has admin/owner role to manage the team
  const canManageTeam = organization?.role === "admin" || organization?.role === "owner";
  
  // Data fetching with SWR
  const {
    data: invitesData,
    mutate: mutateInvites,
    isLoading: isLoadingInvites,
  } = useSWR<InvitesResponse>("/api/app/organizations/current/invites");

  const {
    data: membersData,
    mutate: mutateMembers,
    isLoading: isLoadingMembers,
  } = useSWR<MembersResponse>("/api/app/organizations/current/members");

  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);

  // Selected item states
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Forms
  const inviteForm = useForm<CreateInviteSchema>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      email: "",
      role: "user",
    },
  });

  const roleForm = useForm<{ role: "user" | "admin" }>({
    defaultValues: {
      role: "user",
    },
  });

  // Action handlers with permission checks
  const onInviteSubmit = async (values: CreateInviteSchema) => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to invite members");
      return;
    }
    
    try {
      const response = await fetch("/api/app/organizations/current/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send invite");
      }

      await mutateInvites();
      setIsInviteDialogOpen(false);
      inviteForm.reset();
      toast.success("Invitation sent successfully");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to send invitation");
      } else {
        toast.error("Failed to send invitation");
      }
    }
  };

  const onRevokeInvite = async () => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to revoke invitations");
      return;
    }
    
    if (!selectedInviteId) return;

    try {
      const response = await fetch(
        `/api/app/organizations/current/invites/${selectedInviteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke invite");
      }

      await mutateInvites();
      setIsRevokeDialogOpen(false);
      setSelectedInviteId(null);
      toast.success("Invitation revoked successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to revoke invitation");
    }
  };

  const onChangeRole = async (values: { role: "user" | "admin" }) => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to change roles");
      return;
    }
    
    if (!selectedMemberId) return;

    try {
      const response = await fetch(
        `/api/app/organizations/current/members/${selectedMemberId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change role");
      }

      await mutateMembers();
      setIsChangeRoleDialogOpen(false);
      setSelectedMemberId(null);
      roleForm.reset();
      toast.success("Role updated successfully");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update role");
      } else {
        toast.error("Failed to update role");
      }
    }
  };

  const onRemoveMember = async () => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to remove members");
      return;
    }
    
    if (!selectedMemberId) return;

    try {
      const response = await fetch(
        `/api/app/organizations/current/members/${selectedMemberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove member");
      }

      await mutateMembers();
      setIsRemoveMemberDialogOpen(false);
      setSelectedMemberId(null);
      toast.success("Member removed successfully");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to remove member");
      } else {
        toast.error("Failed to remove member");
      }
    }
  };

  const handleRoleChange = (member: Member) => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to change roles");
      return;
    }
    
    if (member.role === "owner") return;
    setSelectedMemberId(member.id);
    roleForm.setValue("role", member.role === "admin" ? "admin" : "user");
    setIsChangeRoleDialogOpen(true);
  };

  const handleRemoveMember = (member: Member) => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to remove members");
      return;
    }
    
    if (member.role === "owner") return;
    setSelectedMemberId(member.id);
    setIsRemoveMemberDialogOpen(true);
  };

  const handleRevokeInvite = (inviteId: string) => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to revoke invitations");
      return;
    }
    
    setSelectedInviteId(inviteId);
    setIsRevokeDialogOpen(true);
  };

  const value = {
    // Data and loading states
    invitesData,
    membersData,
    isLoadingInvites,
    isLoadingMembers,
    mutateInvites,
    mutateMembers,
    
    // Dialog states
    isInviteDialogOpen,
    setIsInviteDialogOpen,
    isRevokeDialogOpen,
    setIsRevokeDialogOpen,
    isChangeRoleDialogOpen,
    setIsChangeRoleDialogOpen,
    isRemoveMemberDialogOpen,
    setIsRemoveMemberDialogOpen,
    
    // Selected item states
    selectedInviteId,
    setSelectedInviteId,
    selectedMemberId,
    setSelectedMemberId,
    
    // Forms
    inviteForm,
    roleForm,
    
    // Actions
    onInviteSubmit,
    onRevokeInvite,
    onChangeRole,
    onRemoveMember,
    handleRoleChange,
    handleRemoveMember,
    handleRevokeInvite,
    
    // Permissions
    canManageTeam,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
} 