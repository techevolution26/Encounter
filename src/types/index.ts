export type Role = 'USER' | 'LEADER' | 'ADMIN';

export type Socials = {
  twitter?: string;
  facebook?: string;
  website?: string;
  [key: string]: string | undefined;
};

export interface User {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  avatar?: string | null;
  bio?: string | null;
  is_born_again?: boolean;
  socials?: Socials | null;
  created_at?: string;
  updated_at?: string;
}

export interface Leader {
  id: string;
  user_id: string;
  verified: boolean;
  verification_badge?: string | null;
  bio?: string | null;
  avatar?: string | null;
  followers_count?: number;
  online?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Quote {
  id: string;
  leader_id: string;
  text: string;
  source?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EventItem {
  id: string;
  leader_id: string;
  leader?: Leader | null;
  leader_name?: string | null;
  title: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VerificationRequest {
  id: string;
  leader_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'denied';
  note?: string | null;
  meta?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScanFoundResponse {
  status: 'found';
  match: {
    leaderId: string;
    sessionId: string;
  };
}

export interface ScanNoneResponse {
  status: 'none';
  reason: string;
  fallback: Quote | { id: string; text: string };
}

export type ScanResponse = ScanFoundResponse | ScanNoneResponse;

/* ---------- Auth DTOs ---------- */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/* ---------- Profile DTOs ---------- */

export interface UpdateUserProfilePayload {
  name?: string;
  bio?: string;
  avatar?: string | null;
  socials?: Socials | null;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}

export interface UpdateUserProfileResponse {
  user: User;
}

/* ---------- Leader DTOs ---------- */

export interface UpdateLeaderPayload {
  bio?: string;
  avatar?: string | null;
  verification_badge?: string | null;
}

export interface UpdateLeaderResponse {
  leader: Leader;
}

export interface CreateLeaderEventPayload {
  title: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
}

export interface CreateLeaderEventResponse {
  event: EventItem;
}