export type UserRole = 'candidate' | 'recruiter' | 'agency_admin' | 'admin' | 'client';

export type Permission =
  | 'view_careers'
  | 'apply_role'
  | 'track_application'
  | 'view_ats'
  | 'move_candidate'
  | 'draft_scorecard'
  | 'approve_scorecard'
  | 'view_blind_feed'
  | 'reveal_candidate'
  | 'manage_invoices'
  | 'configure_integrations'
  | 'override_fees'
  | 'manage_clients'
  | 'create_client'
  | 'edit_client'
  | 'delete_client';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientId?: string; // set when role === 'client'
  clientName?: string;
  title?: string;
  location?: string;
  phone?: string;
  token?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  candidate: ['view_careers', 'apply_role', 'track_application'],
  client: ['view_blind_feed', 'reveal_candidate'],
  recruiter: [
    'view_careers',
    'view_ats',
    'move_candidate',
    'draft_scorecard',
    'approve_scorecard',
    'view_blind_feed',
    'reveal_candidate',
    'manage_invoices',
    'manage_clients',
    'create_client',
    'edit_client',
    'delete_client'
  ],
  admin: [
    'view_careers',
    'view_ats',
    'move_candidate',
    'draft_scorecard',
    'approve_scorecard',
    'view_blind_feed',
    'reveal_candidate',
    'manage_invoices',
    'configure_integrations',
    'override_fees',
    'manage_clients',
    'create_client',
    'edit_client',
    'delete_client'
  ],
  agency_admin: [
    'view_careers',
    'view_ats',
    'move_candidate',
    'draft_scorecard',
    'approve_scorecard',
    'view_blind_feed',
    'reveal_candidate',
    'manage_invoices',
    'configure_integrations',
    'override_fees',
    'manage_clients',
    'create_client',
    'edit_client',
    'delete_client'
  ]
};
