export interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "admin" | "user" | "owner";
}

export interface MembersResponse {
  members: Member[];
  success: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export interface InvitesResponse {
  invites: Invitation[];
  success: boolean;
} 