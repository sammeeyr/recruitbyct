import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityLogItem,
  AiInterviewQuestion,
  AiInterviewSession,
  Application,
  ApprovalItem,
  Candidate,
  CareersFilter,
  Client,
  CriterionKey,
  DriveLogItem,
  JobOrder,
  Placement,
  PoolFilter,
  Stage,
  Surface,
  TrackState,
  View
} from '../types';
import {
  FORM_BATCHES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_APPLICATIONS,
  INITIAL_CANDIDATES,
  INITIAL_CLIENTS,
  INITIAL_DRIVE_LOGS,
  INITIAL_JOBS,
  INITIAL_PLACEMENTS,
  KNOCKOUT_QUESTIONS
} from '../data/mockData';
import {
  addDays,
  daysDiff,
  evaluateCandidate,
  generateRefCode,
  nextId,
  STAGE_LABELS
} from '../utils/helpers';
import {
  generateAiInterviewQuestions,
  evaluateInterviewSubmission
} from '../utils/aiInterviewHelper';
import { getUnreadNotificationCount, addStoredNotification } from '../utils/notificationHelper';
import { enrichCandidateProfile } from '../utils/candidateEnrichmentHelper';
import { apiClient } from '../services/apiClient';
import confetti from 'canvas-confetti';

interface ModalState {
  type:
    | 'job'
    | 'app'
    | 'cand'
    | 'jo'
    | 'reject'
    | 'newjob'
    | 'editjob'
    | 'aidraft'
    | 'resume-import'
    | 'linkedin-jobs'
    | 'share-linkedin'
    | 'applicants'
    | 'paystack'
    | 'ai-interview-invite'
    | 'ai-interview-result'
    | 'job-channels'
    | 'client'
    | 'candidate-enrichment';
  id?: string;
  jobId?: string;
  clientId?: string;
  mode?: 'detail' | 'apply' | 'gform' | 'done';
  ref?: string;
  contact?: string;
  merged?: boolean;
  data?: any;
}


interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  view: View;
  surface: Surface;
  navigate: (view: View) => void;
  setSurface: (surface: Surface) => void;

  // Data
  clients: Client[];
  jobs: JobOrder[];
  candidates: Candidate[];
  applications: Application[];
  placements: Placement[];
  driveLogs: DriveLogItem[];
  activityLogs: ActivityLogItem[];
  driveConnected: boolean;
  sheetLogging: boolean;

  // Modals & Notifications
  modal: ModalState | null;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  unreadNotificationCount: number;

  // Public filters & tracking
  careersFilter: CareersFilter;
  setCareersFilter: React.Dispatch<React.SetStateAction<CareersFilter>>;
  trackState: TrackState;
  setTrackState: React.Dispatch<React.SetStateAction<TrackState>>;

  // Staff filters
  pipeJobId: string;
  setPipeJobId: (id: string) => void;
  poolFilter: PoolFilter;
  setPoolFilter: React.Dispatch<React.SetStateAction<PoolFilter>>;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;

  // Computed & actions
  approvals: ApprovalItem[];
  moveApplication: (id: string, stage: Stage) => void;
  submitApplication: (data: {
    jobId: string;
    name: string;
    email: string;
    phone: string;
    loc: string;
    years: number;
    skills: string[];
    answers: Record<string, string>;
    fileName: string;
    source?: 'Careers site' | 'LinkedIn';
    linkedinUrl?: string;
    headline?: string;
    expectedSalary?: number;
    availabilityDays?: number;
  }) => void;
  draftNewJobOrder: (data: {
    clientId: string;
    title: string;
    loc: string;
    cat: string;
    minPay: number;
    maxPay: number;
    minYears: number;
    closes: string;
    summary?: string;
    autoApprove?: boolean;
    duties?: string[];
    must?: CriterionKey[];
    nice?: CriterionKey[];
  }) => Promise<JobOrder>;
  createJobOrder: (job: JobOrder) => void;
  updateJobOrder: (jobId: string, updates: Partial<JobOrder>) => Promise<{ success: boolean; error?: string }>;
  deleteJobOrder: (jobId: string) => void;
  importBatchCandidates: (jobId: string, candidatesList: any[]) => void;
  approveJobScorecard: (jobId: string) => Promise<{ success: boolean; error?: string }>;
  updateJobListing: (jobId: string, updates: Partial<JobOrder['listing']>) => Promise<void>;
  updateJobState: (jobId: string, state: JobOrder['state']) => Promise<void>;
  addCandidateToPipeline: (candId: string, jobId: string) => void;
  updateApplicationNotes: (appId: string, notes: string) => void;
  sendRejectMessage: (appId: string) => void;
  keepApplicationInPipeline: (appId: string) => void;
  pullGoogleFormBatch: () => void;
  toggleDrive: () => void;
  retryDriveSync: (logId: string) => void;
  toggleSheetLogging: () => void;
  updatePlacementInvoice: (id: string, invoice: Placement['invoice']) => void;
  openReplacementSearch: (placementId: string) => void;
  reengageCandidate: (candId: string) => void;

  // Client actions
  clientInterviewRequest: (appId: string) => void;
  clientToggleHold: (appId: string) => void;
  clientPass: (appId: string, reason: string) => void;
  clientMakeOffer: (appId: string) => void;
  clientApproveOffer: (appId: string) => void;
  withdrawApplication: (appId: string) => void;

  // AI Interview
  inviteCandidateToAiInterview: (
    appId: string,
    customQuestions?: AiInterviewQuestion[]
  ) => Promise<{ token: string; inviteUrl: string } | null>;
  submitAiInterviewResponses: (
    token: string,
    answers: { questionId: string; answerText: string }[]
  ) => Promise<any>;

  // Client Management (Agency Recruiter / Admin CRUD)
  createClient: (data: {
    name: string;
    industry?: string;
    contact: string;
    email?: string;
    phone?: string;
    fee?: number;
    guarantee?: number;
  }) => Promise<{ success: boolean; client?: Client; error?: string }>;
  updateClient: (id: string, data: Partial<Client>) => Promise<{ success: boolean; client?: Client; error?: string }>;
  deleteClient: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Candidate Profile Enrichment (20+ Platforms)
  enrichCandidate: (candidateId: string) => Promise<Candidate | null>;

  // System
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function pathToView(pathname: string): View {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/careers' || clean.startsWith('/jobs/') || clean.startsWith('/apply/') || clean.startsWith('/careers/job/')) return 'careers';
  if (clean === '/careers/track' || clean === '/track') return 'track';
  if (clean === '/onboard' || clean === '/recruiter-onboarding' || clean === '/join') return 'onboard';
  if (clean === '/login' || clean === '/signin' || clean === '/recruiter/login') return 'login';
  if (clean === '/interview' || clean.startsWith('/interview')) return 'interview';
  if (clean === '/portal' || clean === '/client' || clean === '/portal/candidates') return 'client-portal';
  if (clean === '/dashboard') return 'dashboard';
  if (clean === '/dashboard/pipeline' || clean === '/pipeline') return 'pipeline';
  if (clean === '/dashboard/pool' || clean === '/pool') return 'pool';
  if (clean === '/dashboard/jobs' || clean === '/job-orders') return 'job-orders';
  if (clean === '/dashboard/clients' || clean === '/clients') return 'clients';
  if (clean === '/dashboard/placements' || clean === '/placements') return 'placements';
  if (clean === '/dashboard/intake' || clean === '/intake') return 'intake';
  if (clean === '/dashboard/drive-sync' || clean === '/drive-sync') return 'drive-sync';
  if (clean === '/admin' || clean === '/dashboard/admin' || clean === '/control-panel') return 'admin';
  if (clean === '/chat-data' || clean === '/ai-copilot' || clean === '/dashboard/ai-chat' || clean === '/dashboard/chat-data') return 'chat-data';
  return 'careers';
}

export function viewToPath(view: View): string {
  switch (view) {
    case 'careers':
      return '/careers';
    case 'track':
      return '/careers/track';
    case 'onboard':
      return '/onboard';
    case 'login':
      return '/login';
    case 'interview':
      return '/interview';
    case 'admin':
      return '/admin';
    case 'chat-data':
      return '/dashboard/chat-data';
    case 'dashboard':
      return '/dashboard';
    case 'pipeline':
      return '/dashboard/pipeline';
    case 'pool':
      return '/dashboard/pool';
    case 'job-orders':
      return '/dashboard/jobs';
    case 'clients':
      return '/dashboard/clients';
    case 'placements':
      return '/dashboard/placements';
    case 'intake':
      return '/dashboard/intake';
    case 'drive-sync':
      return '/dashboard/drive-sync';
    case 'client-portal':
      return '/portal';
    default:
      return '/careers';
  }
}

const SURFACE_HOME: Record<Surface, View> = {
  public: 'careers',
  staff: 'dashboard',
  client: 'client-portal'
};

const VIEW_SURFACE_MAP: Record<View, Surface> = {
  careers: 'public',
  track: 'public',
  onboard: 'public',
  login: 'public',
  interview: 'public',
  admin: 'staff',
  dashboard: 'staff',
  pipeline: 'staff',
  pool: 'staff',
  'job-orders': 'staff',
  clients: 'staff',
  placements: 'staff',
  'drive-sync': 'staff',
  intake: 'staff',
  'chat-data': 'staff',
  'client-portal': 'client'
};

const LIVE_STORAGE_PREFIX = 'recruitbyct_live_';
const NEON_ATS_API = 'https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech';

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(LIVE_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LIVE_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy dummy storage keys on initial startup
  useEffect(() => {
    try {
      const legacyKeys = [
        'recruitbyct_v2_jobs',
        'recruitbyct_v2_cands',
        'recruitbyct_v2_apps',
        'recruitbyct_v2_clients',
        'recruitbyct_v2_placements',
        'recruitbyct_v2_driveLogs',
        'recruitbyct_v2_activityLogs'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch {}
  }, []);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('ctc-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ctc-theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // View & Surface state driven by window.location.pathname
  const [view, setView] = useState<View>(() => {
    return pathToView(window.location.pathname);
  });

  const surface = VIEW_SURFACE_MAP[view] || 'public';

  const navigate = (v: View) => {
    setView(v);
    setModal(null);
    const targetPath = viewToPath(v);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSurface = (s: Surface) => {
    navigate(SURFACE_HOME[s]);
  };

  // Listen to popstate (browser back/forward buttons)
  useEffect(() => {
    const onPopState = () => {
      const v = pathToView(window.location.pathname);
      setView(v);
      setModal(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Main Live Entities State
  const [clients, setClients] = useState<Client[]>(() => loadStorage('clients', [
    {
      id: 'c1',
      name: 'Cube Tech Consults HQ',
      industry: 'IT & Professional Services',
      contact: 'Admin Recruiter (recruitment@cubetechconsults.com)',
      fee: 15,
      guarantee: 90
    }
  ]));

  const [jobs, setJobs] = useState<JobOrder[]>(() => loadStorage('jobs', []));
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const loaded = loadStorage('cands', INITIAL_CANDIDATES);
    return loaded.map(c => enrichCandidateProfile(c).enrichedCandidate);
  });
  const [applications, setApplications] = useState<Application[]>(() => loadStorage('apps', []));
  const [placements, setPlacements] = useState<Placement[]>(() => loadStorage('placements', []));
  const [driveLogs, setDriveLogs] = useState<DriveLogItem[]>(() => loadStorage('driveLogs', []));
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => loadStorage('activityLogs', []));
  const [driveConnected, setDriveConnected] = useState<boolean>(true);
  const [sheetLogging, setSheetLogging] = useState<boolean>(true);
  const [formBatchIndex, setFormBatchIndex] = useState<number>(0);

  // Live Sync with Neon Serverless Postgres Backend
  useEffect(() => {
    let isMounted = true;
    async function syncFromNeon() {
      try {
        // 1. Fetch live jobs from Neon Postgres
        const jobsRes = await fetch(`${NEON_ATS_API}/jobs?role=recruiter`);
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (Array.isArray(jobsData.jobs) && jobsData.jobs.length > 0 && isMounted) {
            const mappedJobs: JobOrder[] = jobsData.jobs.map((dbJob: any) => ({
              id: String(dbJob.id),
              clientId: dbJob.client_id || 'c1',
              title: dbJob.title,
              slug: dbJob.slug || undefined,
              location: dbJob.location || 'Abuja',
              type: dbJob.work_type || 'Full-time',
              category: dbJob.category || 'Customer service',
              salary: [Number(dbJob.salary_min) || 300000, Number(dbJob.salary_max) || 450000],
              closes: dbJob.closes_at ? String(dbJob.closes_at).split('T')[0] : addDays(30),
              state: dbJob.state || 'open',
              approved: Boolean(dbJob.approved),
              minYears: Number(dbJob.min_years_experience) || 3,
              listing: {
                published: Boolean(dbJob.is_published),
                confidential: Boolean(dbJob.is_confidential),
                showSalary: Boolean(dbJob.show_salary ?? true)
              },
              summary: dbJob.summary || 'Customer excellence & consulting role at Cube Tech Consults.',
              duties: Array.isArray(dbJob.duties) && dbJob.duties.length > 0 
                ? dbJob.duties 
                : ['Ensure high first-contact resolution for all customer inquiries', 'Audit communication logs and customer escalations'],
              must: Array.isArray(dbJob.must_have_skills) && dbJob.must_have_skills.length > 0
                ? dbJob.must_have_skills
                : [
                    { label: 'Customer Service & Communication', keys: ['cx', 'communication', 'support'] },
                    { label: 'CRM & Omnichannel Escalation', keys: ['crm', 'zendesk', 'resolution'] }
                  ],
              nice: Array.isArray(dbJob.nice_to_have_skills) ? dbJob.nice_to_have_skills : [],
              listingFeePaid: Boolean(dbJob.listing_fee_paid),
              listingFeeAmount: Number(dbJob.listing_fee_amount) || 10000,
              listingFeeRef: dbJob.listing_fee_ref || '',
              recruiterEmail: dbJob.recruiter_email || 'recruiter@cubetechconsults.com'
            }));
            setJobs(mappedJobs);
            saveStorage('jobs', mappedJobs);
          }
        }

        // 2. Fetch live candidates from Neon Postgres
        const candsRes = await fetch(`${NEON_ATS_API}/candidates?role=recruiter`);
        if (candsRes.ok) {
          const candsData = await candsRes.json();
          if (Array.isArray(candsData.candidates) && candsData.candidates.length > 0 && isMounted) {
            const mappedCands: Candidate[] = candsData.candidates.map((dbCand: any) => ({
              id: String(dbCand.id),
              name: dbCand.fullName || dbCand.displayName,
              headline: dbCand.headline || 'Professional Consultant',
              loc: dbCand.location || 'Abuja',
              years: Number(dbCand.yearsExperience) || 0,
              skills: Array.isArray(dbCand.skills) ? dbCand.skills : [],
              sal: Number(dbCand.expectedSalary) || 0,
              avail: Number(dbCand.availabilityDays) || 0,
              verified: dbCand.lastVerifiedAt ? String(dbCand.lastVerifiedAt).split('T')[0] : '2026-11-09',
              drive: 'synced',
              email: dbCand.email || '',
              phone: dbCand.phone || ''
            }));
            setCandidates(mappedCands);
            saveStorage('cands', mappedCands);
          }
        }

        // 3. Fetch live clients from Neon Postgres
        const clientsRes = await fetch(`${NEON_ATS_API}/clients`);
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          if (Array.isArray(clientsData.clients) && clientsData.clients.length > 0 && isMounted) {
            const mappedClients: Client[] = clientsData.clients.map((c: any) => ({
              id: String(c.id),
              slug: c.slug || undefined,
              name: c.name,
              industry: c.industry || 'Corporate',
              contact: c.contact_name || c.name,
              contactEmail: c.contact_email || '',
              email: c.contact_email || 'client@cubetechconsults.com',
              contactPhone: c.contact_phone || '',
              phone: c.contact_phone || '',
              fee: Number(c.fee_percentage) || 15,
              feePct: Number(c.fee_percentage) || 15,
              guarantee: Number(c.guarantee_days) || 90,
              guaranteeDays: Number(c.guarantee_days) || 90,
              createdAt: c.created_at ? String(c.created_at).split('T')[0] : undefined
            }));
            setClients(mappedClients);
            saveStorage('clients', mappedClients);
          }
        }

        // 4. Fetch live applications from Neon Postgres
        const appsRes = await fetch(`${NEON_ATS_API}/applications`);
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          if (Array.isArray(appsData.applications) && appsData.applications.length > 0 && isMounted) {
            const mappedApps: Application[] = appsData.applications.map((a: any) => ({
              id: String(a.id),
              ref: a.reference_code,
              jobId: String(a.job_id),
              candId: String(a.candidate_id),
              stage: a.stage,
              applied: a.created_at ? String(a.created_at).split('T')[0] : '2026-11-09',
              updated: a.updated_at ? String(a.updated_at).split('T')[0] : '2026-11-09',
              source: a.source || 'Careers portal',
              answers: a.knockout_answers || {},
              file: a.resume_file_url || `${a.candidate_name ? a.candidate_name.replace(/\s+/g, '_') : 'Resume'}_CV.pdf`,
              notes: a.recruiter_notes || '',
              revealed: Boolean(a.is_revealed_to_client),
              hold: Boolean(a.is_on_hold),
              aiInterview: a.ai_interview || undefined
            }));
            setApplications(mappedApps);
            saveStorage('apps', mappedApps);
          }
        }
      } catch (err) {
        console.warn('[Neon Sync] Background live fetch notice:', err);
      }
    }

    syncFromNeon();
    return () => { isMounted = false; };
  }, []);

  // Sync to live local storage for optimistic offline resilience
  useEffect(() => saveStorage('clients', clients), [clients]);
  useEffect(() => saveStorage('jobs', jobs), [jobs]);
  useEffect(() => saveStorage('cands', candidates), [candidates]);
  useEffect(() => saveStorage('apps', applications), [applications]);
  useEffect(() => saveStorage('placements', placements), [placements]);
  useEffect(() => saveStorage('driveLogs', driveLogs), [driveLogs]);
  useEffect(() => saveStorage('activityLogs', activityLogs), [activityLogs]);

  // Modals & Toast
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Progressive App Notifications
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(() => getUnreadNotificationCount());

  useEffect(() => {
    const handleUpdate = () => {
      setUnreadNotificationCount(getUnreadNotificationCount());
    };
    window.addEventListener('recruitbyct_notifications_changed', handleUpdate);
    return () => window.removeEventListener('recruitbyct_notifications_changed', handleUpdate);
  }, []);

  const openNotifications = () => setIsNotificationsOpen(true);
  const closeNotifications = () => setIsNotificationsOpen(false);

  // Deep-linking URL handler: maps /jobs/:slug, /apply/:slug, ?job=:id, ?ref=:ref directly to views/modals
  useEffect(() => {
    if (jobs.length === 0) return;

    try {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const queryJob = params.get('job') || params.get('id');
      const queryApply = params.get('apply') === 'true' || params.get('mode') === 'apply';
      const queryRef = params.get('ref') || params.get('track');

      if (queryRef) {
        navigate('track');
        return;
      }

      let targetJob: JobOrder | undefined;
      let isDirectApply = queryApply;

      if (queryJob) {
        targetJob = jobs.find(j => 
          j.id.toLowerCase() === queryJob.toLowerCase() || 
          j.slug?.toLowerCase() === queryJob.toLowerCase() || 
          j.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(queryJob.toLowerCase())
        );
      } else if (pathname.startsWith('/jobs/') || pathname.startsWith('/careers/job/')) {
        const segments = pathname.split('/').filter(Boolean);
        const slugOrId = decodeURIComponent(segments[segments.length - 1]).toLowerCase();
        targetJob = jobs.find(j => 
          j.id.toLowerCase() === slugOrId || 
          j.slug?.toLowerCase() === slugOrId || 
          j.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(slugOrId)
        );
      } else if (pathname.startsWith('/apply/')) {
        const segments = pathname.split('/').filter(Boolean);
        const slugOrId = decodeURIComponent(segments[segments.length - 1]).toLowerCase();
        targetJob = jobs.find(j => 
          j.id.toLowerCase() === slugOrId || 
          j.slug?.toLowerCase() === slugOrId || 
          j.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(slugOrId)
        );
        isDirectApply = true;
      }

      if (targetJob) {
        setModal({
          type: 'job',
          id: targetJob.id,
          mode: isDirectApply ? 'apply' : 'detail'
        });
      }
    } catch (e) {
      console.warn('[Deep Link] Resolution notice:', e);
    }
  }, [jobs]);

  const openModal = (m: ModalState) => setModal(m);
  const closeModal = () => setModal(null);

  const showToast = (msg: string) => {
    setToast(msg);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Filters State
  const [careersFilter, setCareersFilter] = useState<CareersFilter>({
    q: '',
    loc: '',
    cat: '',
    type: '',
    status: 'all'
  });

  const [trackState, setTrackState] = useState<TrackState>({
    step: 1,
    ref: '',
    contact: '',
    err: '',
    fails: 0,
    selId: null,
    code: '',
    valid: false
  });

  const [pipeJobId, setPipeJobId] = useState<string>('jo1');

  const [poolFilter, setPoolFilter] = useState<PoolFilter>({
    q: '',
    loc: '',
    jobId: ''
  });

  const [selectedClientId, setSelectedClientId] = useState<string>('c1');

  // Helper to add activity log
  const logActivity = (message: string) => {
    const item: ActivityLogItem = { t: new Date().toISOString(), m: message };
    setActivityLogs(prev => [item, ...prev].slice(0, 40));
  };

  // Helper to place candidate
  const triggerPlacement = (app: Application) => {
    if (placements.some(p => p.appId === app.id)) return;
    const j = jobs.find(x => x.id === app.jobId);
    const c = candidates.find(x => x.id === app.candId);
    if (!j || !c) return;
    const clientObj = clients.find(cl => cl.id === j.clientId);
    const newPlacement: Placement = {
      id: nextId('p'),
      appId: app.id,
      name: c.name,
      title: j.title,
      clientId: clientObj ? clientObj.id : 'c1',
      start: addDays(30),
      salary: Math.round((j.salary[0] + j.salary[1]) / 2),
      guarantee: clientObj ? clientObj.guarantee : 90,
      invoice: 'Draft',
      status: 'active'
    };
    setPlacements(prev => [newPlacement, ...prev]);

    // Mark job filled if was open
    if (j.state === 'open') {
      setJobs(prev => prev.map(item => (item.id === j.id ? { ...item, state: 'filled' } : item)));
    }

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  // Move application between stages
  const moveApplication = (id: string, stage: Stage) => {
    const app = applications.find(a => a.id === id);
    if (!app || app.stage === stage) return;
    const oldStage = app.stage;
    const isRevealed = ['interview', 'offer', 'placed'].includes(stage) || app.revealed;

    setApplications(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        return {
          ...a,
          stage,
          prev: stage === 'rejected' || stage === 'withdrawn' ? oldStage : a.prev,
          updated: new Date().toISOString(),
          rejectPending: null,
          revealed: isRevealed
        };
      })
    );

    const c = candidates.find(x => x.id === app.candId);
    const j = jobs.find(x => x.id === app.jobId);
    const name = c ? c.name : 'Candidate';
    const title = j ? j.title : 'Job';
    logActivity(`${name} moved to ${STAGE_LABELS[stage]} for ${title}`);

    if (stage === 'placed') {
      triggerPlacement(app);
    }

    // Sync pipeline stage to live Neon Postgres backend
    fetch(`${NEON_ATS_API}/applications/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: id,
        stage,
        notes: `Advanced to ${STAGE_LABELS[stage]}`
      })
    }).catch(e => console.warn('[Neon Sync] Stage sync notice:', e));
  };

  // Approvals derivation
  const approvals = useMemo<ApprovalItem[]>(() => {
    const items: ApprovalItem[] = [];

    // Draft jobs that need scorecard approval
    jobs
      .filter(j => j.state === 'draft' && !j.approved)
      .forEach(j => {
        const clientObj = clients.find(c => c.id === j.clientId);
        items.push({
          title: `Approve the scorecard for ${j.title}`,
          sub: `${clientObj ? clientObj.name : 'Client'} · drafted by AI, nothing is published yet`,
          btn: 'Review scorecard',
          act: 'openJo',
          id: j.id
        });
      });

    // Rejection messages waiting for recruiter review
    applications
      .filter(a => !!a.rejectPending)
      .forEach(a => {
        const c = candidates.find(x => x.id === a.candId);
        const j = jobs.find(x => x.id === a.jobId);
        items.push({
          title: `Review a not-progressed message for ${c ? c.name : 'Candidate'}`,
          sub: `${j ? j.title : 'Role'} · ${
            a.rejectPending?.src === 'client'
              ? 'client feedback: ' + a.rejectPending.reason
              : 'drafted for you'
          }`,
          btn: 'Review message',
          act: 'reviewReject',
          id: a.id
        });
      });

    // Shortlist suggestions (AI score >= 80 in screening)
    applications
      .filter(a => a.stage === 'screening' && !a.rejectPending)
      .forEach(a => {
        const j = jobs.find(x => x.id === a.jobId);
        const c = candidates.find(x => x.id === a.candId);
        if (!j || !c) return;
        const evaluation = evaluateCandidate(j, c, a.answers, KNOCKOUT_QUESTIONS);
        if (evaluation.score >= 80) {
          items.push({
            title: `Confirm shortlist: ${c.name}`,
            sub: `${j.title} · AI match ${evaluation.score} of 100`,
            btn: 'Confirm shortlist',
            act: 'confirmShort',
            id: a.id
          });
        }
      });

    // Low score warnings (< 40 in new or screening)
    applications
      .filter(a => (a.stage === 'new' || a.stage === 'screening') && !a.rejectPending && !a.keep)
      .forEach(a => {
        const j = jobs.find(x => x.id === a.jobId);
        const c = candidates.find(x => x.id === a.candId);
        if (!j || !c) return;
        const evaluation = evaluateCandidate(j, c, a.answers, KNOCKOUT_QUESTIONS);
        if (evaluation.score < 40) {
          items.push({
            title: `AI suggests not progressing ${c.name}`,
            sub: `${j.title} · match ${evaluation.score}, only ${evaluation.must} of ${j.must.length} must-haves found`,
            btn: 'Draft message',
            act: 'reviewReject',
            id: a.id
          });
        }
      });

    return items;
  }, [jobs, clients, applications, candidates]);

  // Submit direct application from Careers
  const submitApplication = ({
    jobId,
    name,
    email,
    phone,
    loc,
    years,
    skills,
    answers,
    fileName,
    source = 'Careers site',
    linkedinUrl,
    headline,
    expectedSalary,
    availabilityDays = 0
  }: {
    jobId: string;
    name: string;
    email: string;
    phone: string;
    loc: string;
    years: number;
    skills: string[];
    answers: Record<string, string>;
    fileName: string;
    source?: 'Careers site' | 'LinkedIn';
    linkedinUrl?: string;
    headline?: string;
    expectedSalary?: number;
    availabilityDays?: number;
  }) => {
    const j = jobs.find(x => x.id === jobId);
    if (!j) return;

    let candidateObj = candidates.find(c => c.email.toLowerCase() === email.toLowerCase());
    let merged = false;

    if (candidateObj) {
      merged = true;
      const updatedSkills = [...candidateObj.skills];
      skills.forEach(s => {
        if (!updatedSkills.some(k => k.toLowerCase() === s.toLowerCase())) {
          updatedSkills.push(s);
        }
      });

      const updatedCand: Candidate = {
        ...candidateObj,
        phone,
        headline: headline || candidateObj.headline,
        sal: expectedSalary || candidateObj.sal,
        avail: availabilityDays !== undefined ? availabilityDays : candidateObj.avail,
        years: Math.max(candidateObj.years, years),
        skills: updatedSkills,
        linkedinUrl: linkedinUrl || candidateObj.linkedinUrl,
        verified: addDays(0)
      };

      setCandidates(prev => prev.map(c => (c.id === updatedCand.id ? updatedCand : c)));
      candidateObj = updatedCand;
    } else {
      const newCand: Candidate = {
        id: nextId('k'),
        name,
        headline: headline || (skills[0] || 'Applicant') + ' professional',
        loc,
        years,
        skills,
        sal: expectedSalary || Math.round((j.salary[0] + j.salary[1]) / 2),
        avail: availabilityDays || 0,
        verified: addDays(0),
        drive: driveConnected ? 'synced' : 'queued',
        email,
        phone,
        linkedinUrl
      };
      // Seamlessly enrich profile with AI web engine across 20+ platforms
      const { enrichedCandidate } = enrichCandidateProfile(newCand);
      setCandidates(prev => [enrichedCandidate, ...prev]);
      candidateObj = enrichedCandidate;
    }

    const ref = generateRefCode();
    const newApp: Application = {
      id: nextId('a'),
      ref,
      jobId: j.id,
      candId: candidateObj.id,
      stage: 'new',
      applied: new Date().toISOString(),
      updated: new Date().toISOString(),
      source,
      answers,
      file: fileName || `${name.replace(/\s+/g, '_')}_CV.pdf`,
      notes: '',
      revealed: false,
      linkedinUrl
    };

    setApplications(prev => [newApp, ...prev]);

    // Live sync application to Neon Postgres backend
    fetch(`${NEON_ATS_API}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: j.id,
        fullName: name,
        email,
        phone,
        location: loc,
        yearsExperience: years,
        skills,
        headline: headline || candidateObj?.headline,
        linkedinUrl,
        source,
        resumeFileUrl: newApp.file,
        knockoutAnswers: answers
      })
    }).catch(e => console.warn('[Neon Sync] Application submission notice:', e));

    // Drive sync log
    const newDriveLog: DriveLogItem = {
      id: nextId('d'),
      file: newApp.file,
      cand: name,
      source: 'Careers site',
      at: new Date().toISOString(),
      status: driveConnected ? 'Synced' : 'Queued'
    };
    setDriveLogs(prev => [newDriveLog, ...prev]);

    logActivity(`${name} applied to ${j.title}`);

    setModal({
      type: 'job',
      id: j.id,
      mode: 'done',
      ref,
      merged,
      contact: email
    });
  };

  // Draft a new job order with AI Scorecard
  const draftNewJobOrder = async ({
    clientId,
    title,
    loc,
    cat,
    minPay,
    maxPay,
    minYears,
    closes,
    summary,
    autoApprove,
    duties,
    must,
    nice
  }: {
    clientId: string;
    title: string;
    loc: string;
    cat: string;
    minPay: number;
    maxPay: number;
    minYears: number;
    closes: string;
    summary?: string;
    autoApprove?: boolean;
    duties?: string[];
    must?: CriterionKey[];
    nice?: CriterionKey[];
  }): Promise<JobOrder> => {
    const kwMap: Record<string, [string, string[]][]> = {
      Technology: [
        ['Core programming language', ['node.js', 'python', 'java', 'typescript', 'react']],
        ['Databases', ['postgresql', 'sql', 'mongodb']],
        ['Testing and Architecture', ['testing', 'ci/cd', 'docker', 'aws']]
      ],
      Finance: [
        ['Finance & Accounting background', ['accounting', 'compliance', 'finance']],
        ['Excel & Financial models', ['excel', 'reconciliation']],
        ['Financial reporting & KYC', ['reporting', 'kyc', 'aml']]
      ],
      Logistics: [
        ['Fleet & Warehouse operations', ['fleet management', 'logistics', 'dispatch']],
        ['Route planning & vendor management', ['route planning', 'vendor management']],
        ['HSE standards & reporting', ['hse', 'reporting']]
      ],
      Sales: [
        ['Sales & business development', ['sales', 'fmcg sales', 'distributor management']],
        ['Client negotiation', ['negotiation', 'contracts']],
        ['CRM tools & pipeline reporting', ['crm', 'reporting']]
      ]
    };

    const mustSpecs = kwMap[cat] || [
      ['Relevant core experience', [cat.toLowerCase(), 'operations', 'customer service']],
      ['Reporting & documentation', ['reporting', 'documentation']],
      ['Stakeholder communication', ['communication', 'team leadership']]
    ];

    const niceSpecs: [string, string[], number][] = [
      ['Advanced Excel or Analytics', ['excel'], 10],
      ['Team leadership & mentorship', ['team leadership'], 10],
      ['CRM or ERP systems', ['crm', 'erp'], 10]
    ];

    const isApproved = Boolean(autoApprove);
    const newJob: JobOrder = {
      id: nextId('jo'),
      clientId: clientId || 'c1',
      title,
      location: loc,
      type: 'Full-time',
      category: cat,
      salary: [minPay, maxPay],
      closes,
      state: isApproved ? 'open' : 'draft',
      approved: isApproved,
      minYears,
      listing: {
        published: isApproved,
        confidential: false,
        showSalary: true
      },
      summary:
        summary ||
        `Role summary for ${title} at Cube Tech Consults. This position is responsible for delivering high-impact operational deliverables, cross-functional team coordination, and strategic client goals.`,
      duties:
        duties && duties.length > 0
          ? duties
          : [
              'Deliver the core objectives and project milestones agreed with the client',
              'Lead or collaborate with cross-functional teams day to day',
              'Produce weekly status reports on KPIs and blockers',
              'Uphold company standards and service levels'
            ],
      must: must && must.length > 0 ? must : mustSpecs.map(([label, keys]) => ({ label, keys })),
      nice: niceSpecs.map(([label, keys, w]) => ({ label, keys, w })),
      listingFeePaid: isApproved,
      listingFeeAmount: 10000,
      listingFeeRef: isApproved ? 'PLATFORM_ADMIN_CREATION' : undefined,
      recruiterEmail: 'recruiter@cubetechconsults.com'
    };

    const nextJobs = [newJob, ...jobs];
    setJobs(nextJobs);
    saveStorage('jobs', nextJobs);

    // Live sync draft job to Neon Postgres backend
    try {
      await fetch(`${NEON_ATS_API}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newJob.id,
          clientId: newJob.clientId,
          title: newJob.title,
          location: newJob.location,
          workType: newJob.type,
          category: newJob.category,
          salaryMin: newJob.salary[0],
          salaryMax: newJob.salary[1],
          summary: newJob.summary,
          recruiterEmail: newJob.recruiterEmail,
          duties: newJob.duties,
          mustHaveSkills: newJob.must,
          niceToHaveSkills: newJob.nice,
          approved: newJob.approved,
          isPublished: newJob.listing.published,
          state: newJob.state,
          listingFeePaid: newJob.listingFeePaid,
          listingFeeAmount: newJob.listingFeeAmount,
          listingFeeRef: newJob.listingFeeRef
        })
      });
    } catch (e) {
      console.warn('[Neon Sync] Job creation notice:', e);
    }

    logActivity(`Created job role for ${newJob.title}`);
    showToast(isApproved ? `Job '${title}' published live for client.` : `Scorecard drafted for '${title}'.`);
    setModal({ type: 'jo', id: newJob.id });
    return newJob;
  };

  // 1. Create a job order (manual or AI generated)
  const createJobOrder = async (newJob: JobOrder) => {
    const nextJobs = [newJob, ...jobs];
    setJobs(nextJobs);
    saveStorage('jobs', nextJobs);

    try {
      await fetch(`${NEON_ATS_API}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newJob.id,
          clientId: newJob.clientId,
          title: newJob.title,
          location: newJob.location,
          workType: newJob.type,
          category: newJob.category,
          salaryMin: newJob.salary[0],
          salaryMax: newJob.salary[1],
          summary: newJob.summary,
          recruiterEmail: newJob.recruiterEmail || 'recruiter@cubetechconsults.com',
          duties: newJob.duties,
          mustHaveSkills: newJob.must,
          niceToHaveSkills: newJob.nice,
          approved: newJob.approved,
          isPublished: newJob.listing.published,
          state: newJob.state,
          listingFeePaid: newJob.listingFeePaid,
          listingFeeAmount: newJob.listingFeeAmount,
          listingFeeRef: newJob.listingFeeRef
        })
      });
    } catch (e) {
      console.warn('[Neon Sync] Create job notice:', e);
    }
    logActivity(`Created job order: ${newJob.title}`);
    showToast(`Job role '${newJob.title}' created.`);
  };

  // 2. Update existing job order (Admin/Recruiter Edit + AI Polish & Scorecard save)
  const updateJobOrder = async (
    jobId: string,
    updates: Partial<JobOrder>
  ): Promise<{ success: boolean; error?: string }> => {
    // Optimistically update React state and localStorage immediately
    const nextJobs = jobs.map(j => {
      if (j.id !== jobId) return j;
      return { ...j, ...updates };
    });
    setJobs(nextJobs);
    saveStorage('jobs', nextJobs);

    try {
      const res = await fetch(`${NEON_ATS_API}/jobs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: jobId,
          title: updates.title,
          location: updates.location,
          workType: updates.type,
          category: updates.category,
          salaryMin: updates.salary ? updates.salary[0] : undefined,
          salaryMax: updates.salary ? updates.salary[1] : undefined,
          summary: updates.summary,
          state: updates.state,
          approved: updates.approved,
          isPublished: updates.listing?.published,
          isConfidential: updates.listing?.confidential,
          showSalary: updates.listing?.showSalary,
          duties: updates.duties,
          mustHaveSkills: updates.must,
          niceToHaveSkills: updates.nice
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.details || `Server returned HTTP ${res.status}`;
        console.error('[Neon ATS API Error] Update job failed:', errMsg);
        showToast(`Warning: Failed to persist to Neon (${errMsg}). Saved locally.`);
        return { success: false, error: errMsg };
      }

      const j = jobs.find(x => x.id === jobId);
      logActivity(`Updated job order: ${updates.title || j?.title || jobId}`);
      showToast(`Job '${updates.title || j?.title}' and scorecard saved to database.`);
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || 'Network error connecting to Neon';
      console.warn('[Neon Sync] Update job notice:', errMsg);
      showToast('Offline mode: Saved scorecard in browser storage.');
      return { success: false, error: errMsg };
    }
  };

  // 3. Delete job order
  const deleteJobOrder = (jobId: string) => {
    const target = jobs.find(j => j.id === jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setApplications(prev => prev.filter(a => a.jobId !== jobId));

    // Live sync deletion to Neon Postgres ATS API
    fetch(`${NEON_ATS_API}/jobs?id=${jobId}`, {
      method: 'DELETE'
    }).catch(e => console.warn('[Neon Sync] Delete job notice:', e));

    if (target) logActivity(`Deleted job order: ${target.title}`);
    showToast(`Job order '${target?.title || jobId}' deleted.`);
  };

  // Client Management CRUD (Agency Recruiter / Admin)
  const createClient = async (data: {
    name: string;
    industry?: string;
    contact: string;
    email?: string;
    phone?: string;
    fee?: number;
    guarantee?: number;
  }): Promise<{ success: boolean; client?: Client; error?: string }> => {
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const tempId = `c_${Date.now().toString(36)}_${randomSuffix}`;
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + randomSuffix;

      const newClient: Client = {
        id: tempId,
        slug,
        name: data.name.trim(),
        industry: data.industry?.trim() || 'IT & Professional Services',
        contact: data.contact.trim(),
        email: data.email?.trim() || '',
        contactEmail: data.email?.trim() || '',
        phone: data.phone?.trim() || '',
        contactPhone: data.phone?.trim() || '',
        fee: data.fee ?? 15,
        feePct: data.fee ?? 15,
        guarantee: data.guarantee ?? 90,
        guaranteeDays: data.guarantee ?? 90,
        createdAt: new Date().toISOString().split('T')[0]
      };

      // 1. Optimistically update local state & storage
      setClients(prev => [newClient, ...prev]);
      logActivity(`Created client employer: ${newClient.name} (${newClient.industry})`);
      showToast(`Client '${newClient.name}' added successfully.`);

      // 2. Dispatch in-app notification
      addStoredNotification({
        type: 'reminder',
        title: 'New Client Onboarded',
        message: `${newClient.name} (${newClient.industry}) added with ${newClient.fee}% placement fee and ${newClient.guarantee}-day guarantee.`,
        targetView: 'clients'
      });

      // 3. Persist to Neon Postgres backend
      const res = await apiClient.neonFunctions.createClient({
        id: tempId,
        slug,
        name: newClient.name,
        industry: newClient.industry,
        contactName: newClient.contact,
        contactEmail: newClient.email,
        contactPhone: newClient.phone,
        feePercentage: newClient.fee,
        guaranteeDays: newClient.guarantee
      });

      if (res && res.client) {
        const finalClient: Client = {
          ...newClient,
          id: String(res.client.id),
          slug: res.client.slug || slug
        };
        setClients(prev => prev.map(c => c.id === tempId ? finalClient : c));
        return { success: true, client: finalClient };
      }

      return { success: true, client: newClient };
    } catch (err: any) {
      console.warn('[Create Client Error]', err);
      return { success: false, error: err.message || 'Failed to create client.' };
    }
  };

  const updateClient = async (
    id: string,
    updates: Partial<Client>
  ): Promise<{ success: boolean; client?: Client; error?: string }> => {
    try {
      const existing = clients.find(c => c.id === id);
      if (!existing) {
        return { success: false, error: 'Client not found.' };
      }

      const updatedClient: Client = {
        ...existing,
        ...updates,
        fee: updates.fee ?? updates.feePct ?? existing.fee,
        feePct: updates.fee ?? updates.feePct ?? existing.fee,
        guarantee: updates.guarantee ?? updates.guaranteeDays ?? existing.guarantee,
        guaranteeDays: updates.guarantee ?? updates.guaranteeDays ?? existing.guarantee,
        contactEmail: updates.contactEmail ?? updates.email ?? existing.contactEmail,
        email: updates.contactEmail ?? updates.email ?? existing.email,
        contactPhone: updates.contactPhone ?? updates.phone ?? existing.contactPhone,
        phone: updates.contactPhone ?? updates.phone ?? existing.phone
      };

      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      logActivity(`Updated client employer terms: ${updatedClient.name}`);
      showToast(`Client '${updatedClient.name}' updated.`);

      // Persist to Neon Postgres
      await apiClient.neonFunctions.updateClient(id, {
        name: updatedClient.name,
        industry: updatedClient.industry,
        contactName: updatedClient.contact,
        contactEmail: updatedClient.contactEmail,
        contactPhone: updatedClient.contactPhone,
        feePercentage: updatedClient.fee,
        guaranteeDays: updatedClient.guarantee,
        slug: updatedClient.slug
      });

      return { success: true, client: updatedClient };
    } catch (err: any) {
      console.warn('[Update Client Error]', err);
      return { success: false, error: err.message || 'Failed to update client.' };
    }
  };

  const deleteClient = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const target = clients.find(c => c.id === id);
      setClients(prev => prev.filter(c => c.id !== id));
      if (target) logActivity(`Deleted client employer: ${target.name}`);
      showToast(`Client '${target?.name || id}' deleted.`);

      // Persist to Neon Postgres
      await apiClient.neonFunctions.deleteClient(id);
      return { success: true };
    } catch (err: any) {
      console.warn('[Delete Client Error]', err);
      return { success: false, error: err.message || 'Failed to delete client.' };
    }
  };

  // 3d. Candidate Profile Enrichment (20+ Platforms)
  const enrichCandidate = async (candidateId: string): Promise<Candidate | null> => {
    const target = candidates.find(c => c.id === candidateId);
    if (!target) return null;
    const { enrichedCandidate, platformsDiscovered } = enrichCandidateProfile(target);
    setCandidates(prev => prev.map(c => (c.id === candidateId ? enrichedCandidate : c)));
    logActivity(`AI Engine enriched candidate profile across ${platformsDiscovered.length} platforms: ${enrichedCandidate.name}`);
    showToast(`Profile for '${enrichedCandidate.name}' enriched across ${platformsDiscovered.length} platforms.`);
    return enrichedCandidate;
  };

  // 4. Batch import shortlisted candidates from Resume Scanner
  const importBatchCandidates = (jobId: string, candidatesList: any[]) => {
    const targetJob = jobs.find(j => j.id === jobId);
    const newCandidates: Candidate[] = [];
    const newApps: Application[] = [];

    candidatesList.forEach(item => {
      const candId = nextId('k');
      const candidateObj: Candidate = {
        id: candId,
        name: item.fullName || item.name,
        headline: `${item.skills?.[0] || 'Applicant'} · Shortlisted by AI`,
        loc: item.location || 'Abuja',
        years: Number(item.yearsExperience || item.years) || 3,
        skills: Array.isArray(item.skills) ? item.skills : ['Customer Service'],
        sal: Number(item.expectedSalary || item.sal) || (targetJob ? Math.round((targetJob.salary[0] + targetJob.salary[1]) / 2) : 350000),
        avail: 0,
        verified: addDays(0),
        drive: 'synced',
        email: item.email,
        phone: item.phone || 'N/A'
      };
      // Seamlessly enrich batch imported candidate profile with AI engine
      const { enrichedCandidate } = enrichCandidateProfile(candidateObj);
      newCandidates.push(enrichedCandidate);

      if (targetJob) {
        const ref = generateRefCode();
        const app: Application = {
          id: nextId('a'),
          ref,
          jobId: targetJob.id,
          candId: candidateObj.id,
          stage: 'shortlisted',
          applied: new Date().toISOString(),
          updated: new Date().toISOString(),
          source: 'Upload',
          answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
          file: item.resumeFileName || `${candidateObj.name.replace(/\s+/g, '_')}_CV.pdf`,
          notes: `Batch Shortlisted by AI (Fit Score: ${item.fitScore || 85}%). Highlights: ${item.highlights || 'Meets criteria'}`,
          revealed: false
        };
        newApps.push(app);
      }
    });

    setCandidates(prev => [...newCandidates, ...prev]);
    if (newApps.length > 0) {
      setApplications(prev => [...newApps, ...prev]);
    }

    // Live sync batch to Neon Postgres
    fetch(`${NEON_ATS_API}/candidates/batch-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: targetJob?.id,
        candidates: candidatesList.map(c => ({
          fullName: c.fullName || c.name,
          email: c.email,
          phone: c.phone,
          location: c.location,
          yearsExperience: c.yearsExperience || c.years,
          skills: c.skills,
          expectedSalary: c.expectedSalary || c.sal,
          resumeFileName: c.resumeFileName || `${(c.fullName || c.name).replace(/\s+/g, '_')}_CV.pdf`,
          fitScore: c.fitScore || 85,
          notes: c.highlights || 'Shortlisted via AI scan'
        }))
      })
    }).catch(e => console.warn('[Neon Sync] Batch import notice:', e));

    logActivity(`Imported ${candidatesList.length} shortlisted candidates${targetJob ? ` for ${targetJob.title}` : ''}`);
    showToast(`Successfully imported ${candidatesList.length} candidates into pipeline.`);
  };

  // Scorecard approval (persisted to database & localStorage)
  const approveJobScorecard = async (jobId: string): Promise<{ success: boolean; error?: string }> => {
    const nextJobs = jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        approved: true,
        state: 'open' as const,
        listing: { ...j.listing, published: true }
      };
    });
    setJobs(nextJobs);
    saveStorage('jobs', nextJobs);

    try {
      const res = await fetch(`${NEON_ATS_API}/jobs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: jobId,
          approved: true,
          state: 'open',
          isPublished: true
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || `Server HTTP ${res.status}`;
        console.error('[Neon ATS API Error] Approve scorecard failed:', errMsg);
        return { success: false, error: errMsg };
      }

      const j = jobs.find(x => x.id === jobId);
      if (j) logActivity(`Scorecard approved for ${j.title}`);
      showToast('Approved and published to the careers site & live database.');
      return { success: true };
    } catch (err: any) {
      console.warn('[Neon Sync] Approve job notice:', err);
      showToast('Approved locally. Sync will complete when online.');
      return { success: true };
    }
  };

  const updateJobListing = async (jobId: string, updates: Partial<JobOrder['listing']>): Promise<void> => {
    const nextJobs = jobs.map(j => {
      if (j.id !== jobId) return j;
      return { ...j, listing: { ...j.listing, ...updates } };
    });
    setJobs(nextJobs);
    saveStorage('jobs', nextJobs);

    try {
      await fetch(`${NEON_ATS_API}/jobs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: jobId,
          isPublished: updates.published,
          isConfidential: updates.confidential,
          showSalary: updates.showSalary
        })
      });
      showToast('Listing updated in database.');
    } catch (e) {
      console.warn('[Neon Sync] Listing update notice:', e);
      showToast('Listing updated locally.');
    }
  };

  const updateJobState = async (jobId: string, state: JobOrder['state']): Promise<void> => {
    const nextJobs = jobs.map(j => {
      if (j.id !== jobId) return j;
      return { ...j, state };
    });
    setJobs(nextJobs);
    saveStorage('jobs', nextJobs);

    try {
      await fetch(`${NEON_ATS_API}/jobs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: jobId,
          state
        })
      });
      const j = jobs.find(x => x.id === jobId);
      if (j) logActivity(`${j.title} marked ${state}`);
      showToast(`Job status updated to ${state}.`);
    } catch (e) {
      console.warn('[Neon Sync] Job state notice:', e);
      showToast(`Job status updated to ${state} (local).`);
    }
  };

  const addCandidateToPipeline = (candId: string, jobId: string) => {
    const c = candidates.find(x => x.id === candId);
    const j = jobs.find(x => x.id === jobId);
    if (!c || !j) return;

    const ref = generateRefCode();
    const newApp: Application = {
      id: nextId('a'),
      ref,
      jobId: j.id,
      candId: c.id,
      stage: 'screening',
      applied: new Date().toISOString(),
      updated: new Date().toISOString(),
      source: 'Talent pool',
      answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
      file: `${c.name.replace(/\s+/g, '_')}_CV.pdf`,
      notes: 'Added directly from talent pool.',
      revealed: false
    };

    setApplications(prev => [newApp, ...prev]);

    // Live sync application to Neon Postgres backend
    fetch(`${NEON_ATS_API}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: j.id,
        fullName: c.name,
        email: c.email,
        phone: c.phone,
        resumeFileUrl: newApp.file,
        knockoutAnswers: newApp.answers
      })
    }).catch(e => console.warn('[Neon Sync] Application submission notice:', e));
    logActivity(`${c.name} added from talent pool to ${j.title}`);
    showToast(`Added ${c.name} to ${j.title} at Screening.`);
  };

  const updateApplicationNotes = (appId: string, notes: string) => {
    setApplications(prev =>
      prev.map(a => (a.id === appId ? { ...a, notes } : a))
    );
  };

  const sendRejectMessage = (appId: string) => {
    moveApplication(appId, 'rejected');
    setModal(null);
    showToast('Rejection message sent. Applicant status updated.');
  };

  const keepApplicationInPipeline = (appId: string) => {
    setApplications(prev =>
      prev.map(a => (a.id === appId ? { ...a, rejectPending: null, keep: true } : a))
    );
    setModal(null);
    showToast('Kept in pipeline.');
  };

  // Intake simulation: Pull new Google Form responses
  const pullGoogleFormBatch = () => {
    const batch = FORM_BATCHES[formBatchIndex];
    if (!batch) {
      showToast('No new Google Form responses right now.');
      return;
    }

    const openRoles = jobs.filter(j => j.listing.published && j.state === 'open');
    if (!openRoles.length) {
      showToast('No open roles to route Google Form responses into.');
      return;
    }

    let addedCount = 0;
    const newApps: Application[] = [];
    const newDriveItems: DriveLogItem[] = [];
    let updatedCands = [...candidates];

    batch.forEach((item, index) => {
      const targetJob = openRoles[index % openRoles.length];
      let candObj = updatedCands.find(c => c.email.toLowerCase() === item.e.toLowerCase());

      if (!candObj) {
        candObj = {
          id: nextId('k'),
          name: item.n,
          headline: (item.s[0] || 'Applicant') + ' professional',
          loc: item.l,
          years: item.y,
          skills: item.s,
          sal: Math.round((targetJob.salary[0] + targetJob.salary[1]) / 2),
          avail: 0,
          verified: addDays(0),
          drive: driveConnected ? 'synced' : 'queued',
          email: item.e,
          phone: item.p
        };
        updatedCands = [candObj, ...updatedCands];
      }

      const ref = generateRefCode();
      const appItem: Application = {
        id: nextId('a'),
        ref,
        jobId: targetJob.id,
        candId: candObj.id,
        stage: 'new',
        applied: new Date().toISOString(),
        updated: new Date().toISOString(),
        source: 'Google Form',
        answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
        file: item.f,
        notes: 'Submitted via Google Form integration.',
        revealed: false
      };
      newApps.push(appItem);

      newDriveItems.push({
        id: nextId('d'),
        file: item.f,
        cand: item.n,
        source: 'Google Form',
        at: new Date().toISOString(),
        status: driveConnected ? 'Synced' : 'Queued'
      });

      logActivity(`${item.n} applied to ${targetJob.title} by Google Form`);
      addedCount++;
    });

    setCandidates(updatedCands);
    setApplications(prev => [...newApps, ...prev]);
    setDriveLogs(prev => [...newDriveItems, ...prev]);
    setFormBatchIndex(prev => prev + 1);

    showToast(
      `${addedCount} new Form ${addedCount === 1 ? 'response' : 'responses'} added at New. CVs saved to Drive.`
    );
  };

  const toggleDrive = () => {
    const nextState = !driveConnected;
    setDriveConnected(nextState);
    if (nextState) {
      setDriveLogs(prev =>
        prev.map(item => (item.status === 'Queued' ? { ...item, status: 'Synced' } : item))
      );
      setCandidates(prev => prev.map(c => ({ ...c, drive: 'synced' })));
      showToast('Drive reconnected. Queued files synced.');
    } else {
      showToast('Drive disconnected. New CVs will queue.');
    }
  };

  const retryDriveSync = (logId: string) => {
    setDriveLogs(prev =>
      prev.map(item => (item.id === logId ? { ...item, status: 'Synced' } : item))
    );
    showToast('File synced to Drive.');
  };

  const toggleSheetLogging = () => {
    setSheetLogging(prev => {
      const n = !prev;
      showToast(
        n
          ? 'Google Sheet log is ON.'
          : 'Google Sheet log is PAUSED. Nothing is lost; rows will catch up.'
      );
      return n;
    });
  };

  const updatePlacementInvoice = (id: string, invoice: Placement['invoice']) => {
    setPlacements(prev =>
      prev.map(p => (p.id === id ? { ...p, invoice } : p))
    );
    showToast(`Invoice marked ${invoice}.`);
  };

  const openReplacementSearch = (placementId: string) => {
    const pl = placements.find(p => p.id === placementId);
    if (!pl) return;
    const originalJob = jobs.find(j => j.title === pl.title && j.clientId === pl.clientId);
    const newReplacementJob: JobOrder = {
      id: nextId('jo'),
      clientId: pl.clientId,
      title: `${pl.title} (replacement)`,
      location: originalJob ? originalJob.location : 'Abuja',
      type: 'Full-time',
      category: originalJob ? originalJob.category : 'Finance',
      salary: originalJob ? originalJob.salary : [pl.salary, pl.salary],
      closes: addDays(21),
      state: 'draft',
      approved: false,
      minYears: originalJob ? originalJob.minYears : 3,
      listing: { published: false, confidential: true, showSalary: true },
      summary: `Replacement search for ${pl.name} who departed during the guarantee period.`,
      duties: originalJob ? originalJob.duties : ['Deliver core responsibilities'],
      must: originalJob ? originalJob.must : [],
      nice: originalJob ? originalJob.nice : []
    };

    setJobs(prev => [newReplacementJob, ...prev]);
    logActivity(`Replacement search opened for ${pl.title}`);
    navigate('job-orders');
    showToast('Replacement job order drafted. Approve its scorecard to publish.');
  };

  const reengageCandidate = (candId: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candId ? { ...c, verified: addDays(0) } : c))
    );
    showToast('Re-engagement message queued. Profile marked as verified.');
  };

  // Client Portal Actions
  const clientInterviewRequest = (appId: string) => {
    moveApplication(appId, 'interview');
    showToast('Interview requested. Contact details are now visible.');
  };

  const clientToggleHold = (appId: string) => {
    const target = applications.find(x => x.id === appId);
    const newHold = !target?.hold;
    setApplications(prev =>
      prev.map(a => (a.id === appId ? { ...a, hold: newHold } : a))
    );
    showToast(newHold ? 'Candidate put on hold.' : 'Hold removed.');

    fetch(`${NEON_ATS_API}/applications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, isOnHold: newHold })
    }).catch(e => console.warn('[Neon Sync] Toggle hold notice:', e));
  };

  const clientPass = (appId: string, reason: string) => {
    setApplications(prev =>
      prev.map(a => {
        if (a.id !== appId) return a;
        return {
          ...a,
          rejecting: false,
          rejectPending: { reason, src: 'client' },
          updated: new Date().toISOString()
        };
      })
    );
    const app = applications.find(x => x.id === appId);
    const cand = app ? candidates.find(c => c.id === app.candId) : null;
    logActivity(`Client passed on ${cand ? cand.name : 'Candidate'}: ${reason}`);
    showToast('Feedback sent to your recruiter.');
  };

  const clientMakeOffer = (appId: string) => {
    moveApplication(appId, 'offer');
    showToast('Offer stage started.');
  };

  const clientApproveOffer = (appId: string) => {
    moveApplication(appId, 'placed');
    showToast('Offer approved. Placement recorded.');
  };

  const withdrawApplication = (appId: string) => {
    moveApplication(appId, 'withdrawn');
    showToast('Application withdrawn.');
  };

  // AI Candidate Interview Screening
  const inviteCandidateToAiInterview = async (
    appId: string,
    customQuestions?: AiInterviewQuestion[]
  ): Promise<{ token: string; inviteUrl: string } | null> => {
    const app = applications.find(a => a.id === appId);
    if (!app) return null;

    const job = jobs.find(j => j.id === app.jobId);
    const cand = candidates.find(c => c.id === app.candId);
    const questions = customQuestions && customQuestions.length > 0
      ? customQuestions
      : generateAiInterviewQuestions(job || {});
    const token = `int_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const session: AiInterviewSession = {
      token,
      invitedAt: new Date().toISOString(),
      status: 'invited',
      questions
    };

    setApplications(prev => {
      const next = prev.map(a => (a.id === appId ? { ...a, aiInterview: session } : a));
      saveStorage('applications', next);
      return next;
    });

    logActivity(`Invited candidate ${cand?.name || 'Applicant'} to AI Interview for ${job?.title || 'Job'}`);
    showToast(`AI interview invitation created for ${cand?.name || 'Applicant'}`);

    const inviteUrl = `${window.location.origin}/interview?token=${token}`;

    try {
      fetch(`${NEON_ATS_API}/interviews/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          candidateId: cand?.id,
          jobId: job?.id,
          token,
          questions
        })
      }).catch(() => {});
    } catch {}

    return { token, inviteUrl };
  };

  const submitAiInterviewResponses = async (
    token: string,
    answers: { questionId: string; answerText: string }[]
  ): Promise<any> => {
    const app = applications.find(a => a.aiInterview?.token === token);
    const targetSession = app?.aiInterview;
    const questions = targetSession?.questions || generateAiInterviewQuestions({});

    const evaluation = evaluateInterviewSubmission(questions, answers);

    const updatedSession: AiInterviewSession = {
      ...(targetSession || { token, invitedAt: new Date().toISOString() }),
      token,
      completedAt: new Date().toISOString(),
      status: 'completed',
      questions,
      responses: evaluation.responses,
      overallScore: evaluation.overallScore,
      recommendation: evaluation.recommendation,
      summary: evaluation.summary
    };

    if (app) {
      setApplications(prev => {
        const next = prev.map(a =>
          a.id === app.id
            ? {
                ...a,
                aiInterview: updatedSession
              }
            : a
        );
        saveStorage('applications', next);
        return next;
      });

      const cand = candidates.find(c => c.id === app.candId);
      logActivity(
        `AI Interview completed for ${cand?.name || 'Applicant'}. Score: ${evaluation.overallScore}% (${evaluation.recommendation})`
      );
    }

    try {
      fetch(`${NEON_ATS_API}/interviews/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          answers,
          evaluation
        })
      }).catch(() => {});
    } catch {}

    return { status: 'success', evaluation, session: updatedSession };
  };

  // Reset all to sample defaults
  const resetAllData = () => {
    setClients(INITIAL_CLIENTS);
    setJobs(INITIAL_JOBS);
    setCandidates(INITIAL_CANDIDATES);
    setApplications(INITIAL_APPLICATIONS);
    setPlacements(INITIAL_PLACEMENTS);
    setDriveLogs(INITIAL_DRIVE_LOGS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setDriveConnected(true);
    setSheetLogging(true);
    setFormBatchIndex(0);
    localStorage.clear();
    showToast('All state reset to prototype defaults.');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        view,
        surface,
        navigate,
        setSurface,
        clients,
        jobs,
        candidates,
        applications,
        placements,
        driveLogs,
        activityLogs,
        driveConnected,
        sheetLogging,
        modal,
        openModal,
        closeModal,
        toast,
        showToast,
        isNotificationsOpen,
        openNotifications,
        closeNotifications,
        unreadNotificationCount,
        careersFilter,
        setCareersFilter,
        trackState,
        setTrackState,
        pipeJobId,
        setPipeJobId,
        poolFilter,
        setPoolFilter,
        selectedClientId,
        setSelectedClientId,
        approvals,
        moveApplication,
        submitApplication,
        draftNewJobOrder,
        createJobOrder,
        updateJobOrder,
        deleteJobOrder,
        importBatchCandidates,
        approveJobScorecard,
        updateJobListing,
        updateJobState,
        addCandidateToPipeline,
        updateApplicationNotes,
        sendRejectMessage,
        keepApplicationInPipeline,
        pullGoogleFormBatch,
        toggleDrive,
        retryDriveSync,
        toggleSheetLogging,
        updatePlacementInvoice,
        openReplacementSearch,
        reengageCandidate,
        clientInterviewRequest,
        clientToggleHold,
        clientPass,
        clientMakeOffer,
        clientApproveOffer,
        withdrawApplication,
        inviteCandidateToAiInterview,
        submitAiInterviewResponses,
        createClient,
        updateClient,
        deleteClient,
        enrichCandidate,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
