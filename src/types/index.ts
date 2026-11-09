export type Stage =
  | 'new'
  | 'screening'
  | 'shortlisted'
  | 'submitted'
  | 'interview'
  | 'offer'
  | 'placed'
  | 'rejected'
  | 'withdrawn';

export type JobStatus = 'Open' | 'Closing soon' | 'Filled' | 'Closed' | 'Draft';

export type Surface = 'public' | 'staff' | 'client';

export type View =
  | 'careers'
  | 'track'
  | 'onboard'
  | 'login'
  | 'interview'
  | 'dashboard'
  | 'pipeline'
  | 'pool'
  | 'job-orders'
  | 'clients'
  | 'placements'
  | 'drive-sync'
  | 'intake'
  | 'client-portal'
  | 'admin';

export interface AiInterviewQuestion {
  id: string;
  question: string;
  category: string;
  expectedKeywords: string[];
}

export interface AiInterviewResponse {
  questionId: string;
  questionText: string;
  answerText: string;
  score: number;
  clarityScore: number;
  technicalScore: number;
  feedback: string;
}

export interface AiInterviewSession {
  token: string;
  invitedAt: string;
  completedAt?: string;
  status: 'invited' | 'in_progress' | 'completed' | 'expired';
  questions: AiInterviewQuestion[];
  responses?: AiInterviewResponse[];
  overallScore?: number;
  recommendation?: 'Strong Hire' | 'Advance' | 'Review Needed' | 'Do Not Advance';
  summary?: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  contact: string;
  fee: number; // percentage, e.g. 15 for 15%
  guarantee: number; // days, e.g. 90
}

export interface KnockoutQuestion {
  id: string;
  q: string;
}

export interface CriterionKey {
  label: string;
  keys: string[];
  w?: number; // weight for nice-to-haves
}

export interface JobOrder {
  id: string;
  clientId: string;
  title: string;
  location: string;
  type: string; // 'Full-time' | 'Contract'
  category: string;
  salary: [number, number];
  closes: string; // ISO date string YYYY-MM-DD
  state: 'draft' | 'open' | 'filled' | 'closed';
  approved: boolean;
  minYears: number;
  listing: {
    published: boolean;
    confidential: boolean;
    showSalary: boolean;
  };
  summary: string;
  duties: string[];
  must: CriterionKey[];
  nice: CriterionKey[];
  listingFeePaid?: boolean;
  listingFeeAmount?: number;
  listingFeeRef?: string;
  recruiterEmail?: string;
}

export interface Candidate {
  id: string;
  name: string;
  headline: string;
  loc: string;
  years: number;
  skills: string[];
  sal: number; // expected salary
  avail: number; // days until available, 0 = immediately
  verified: string; // YYYY-MM-DD
  drive: 'synced' | 'queued';
  email: string;
  phone: string;
}

export interface Application {
  id: string;
  ref: string;
  jobId: string;
  candId: string;
  stage: Stage;
  applied: string; // ISO string
  updated: string; // ISO string
  source: 'Careers site' | 'Email' | 'WhatsApp' | 'Google Form' | 'Upload' | 'Talent pool';
  answers: Record<string, string>;
  file: string;
  notes: string;
  revealed: boolean;
  prev?: Stage;
  hold?: boolean;
  rejecting?: boolean;
  keep?: boolean;
  rejectPending?: {
    reason: string;
    src: 'client' | 'ai';
  } | null;
  aiInterview?: AiInterviewSession;
}

export interface Placement {
  id: string;
  appId?: string;
  name: string;
  title: string;
  clientId: string;
  start: string; // YYYY-MM-DD
  salary: number;
  guarantee: number; // days
  invoice: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  status: 'active' | 'left';
  leftDay?: number;
}

export interface DriveLogItem {
  id: string;
  file: string;
  cand: string;
  source: string;
  at: string;
  status: 'Synced' | 'Duplicate' | 'Needs review' | 'Queued';
}

export interface ActivityLogItem {
  t: string;
  m: string;
}

export interface EvaluationCriterion {
  t: 'ko' | 'must' | 'nice' | 'exp';
  label: string;
  met: boolean;
  ev: string;
}

export interface EvaluationResult {
  score: number;
  crit: EvaluationCriterion[];
  ko: boolean;
  must: number;
}

export interface ApprovalItem {
  title: string;
  sub: string;
  btn: string;
  act: 'openJo' | 'reviewReject' | 'confirmShort';
  id: string;
}

export interface CareersFilter {
  q: string;
  loc: string;
  cat: string;
  type: string;
  status: 'all' | 'open' | 'soon' | 'done';
}

export interface PoolFilter {
  q: string;
  loc: string;
  jobId: string;
}

export interface TrackState {
  step: 1 | 2 | 3;
  ref: string;
  contact: string;
  err: string;
  fails: number;
  selId: string | null;
  code: string;
  valid: boolean;
}

