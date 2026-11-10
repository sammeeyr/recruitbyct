import { Candidate, EvaluationResult, JobOrder, JobStatus, KnockoutQuestion, Stage } from '../types';

export const DAY_MS = 864e5;
export const TODAY = (() => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
})();

export const addDays = (n: number): string => {
  return new Date(TODAY.getTime() + n * DAY_MS).toISOString().slice(0, 10);
};

export const daysDiff = (s: string): number => {
  return Math.round((new Date(s.length > 10 ? s : s + 'T12:00:00').getTime() - TODAY.getTime()) / DAY_MS);
};

export const formatDate = (s: string): string => {
  try {
    return new Date(s.length > 10 ? s : s + 'T12:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return s;
  }
};

export const formatNaira = (n: number): string => {
  return '₦' + Math.round(n).toLocaleString('en-NG');
};

export const relativeTime = (iso: string): string => {
  try {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
    const d = Math.round(h / 24);
    return d === 1 ? '1 day ago' : `${d} days ago`;
  } catch {
    return 'recently';
  }
};

let uidCounter = 1000;
export const nextId = (prefix: string): string => `${prefix}${++uidCounter}`;

export const generateRefCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `CTC-${part(4)}-${part(4)}`;
};

export const SPECIAL_ACRONYMS: Record<string, string> = {
  crm: 'CRM',
  hse: 'HSE',
  hmis: 'HMIS',
  erp: 'ERP',
  kyc: 'KYC',
  aml: 'AML',
  'fmcg sales': 'FMCG sales',
  sql: 'SQL',
  aws: 'AWS',
  'node.js': 'Node.js',
  postgresql: 'PostgreSQL',
  typescript: 'TypeScript',
  'ci/cd': 'CI/CD'
};

export const prettyKey = (k: string): string => {
  return SPECIAL_ACRONYMS[k.toLowerCase()] || k.charAt(0).toUpperCase() + k.slice(1);
};

export const firstName = (name: string): string => {
  return String(name).trim().split(' ')[0] || name;
};

export const STAGES: [Stage, string][] = [
  ['new', 'New'],
  ['screening', 'Screening'],
  ['shortlisted', 'Shortlisted'],
  ['submitted', 'Submitted to client'],
  ['interview', 'Interview'],
  ['offer', 'Offer'],
  ['placed', 'Placed']
];

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  submitted: 'Submitted to client',
  interview: 'Interview',
  offer: 'Offer',
  placed: 'Placed',
  rejected: 'Not progressed',
  withdrawn: 'Withdrawn'
};

export const PUBLIC_STAGES = [
  'Received',
  'Under review',
  'Shortlisted',
  'Submitted to employer',
  'Interview stage',
  'Offer stage',
  'Placed'
];

export const STAGE_INDEX: Record<string, number> = {
  new: 0,
  screening: 1,
  shortlisted: 2,
  submitted: 3,
  interview: 4,
  offer: 5,
  placed: 6
};

export const NEXT_STEPS_GUIDE: Record<string, string> = {
  Received: 'A recruiter will review your CV and answers. This usually takes two to three working days.',
  'Under review': 'A recruiter is checking your CV against the role. You may get a short call or WhatsApp message.',
  Shortlisted: 'You are on the shortlist. We confirm with you before your profile is shared with the employer.',
  'Submitted to employer': 'Your profile is with the employer. They decide whether to ask for an interview.',
  'Interview stage': 'An interview has been requested. Watch your phone and email for the time.',
  'Offer stage': 'An offer is being prepared. Keep your phone close.',
  Placed: 'Congratulations. Check your email for the onboarding checklist.',
  'Not progressed': 'This application is not moving forward. Your profile stays in our talent pool for similar roles unless you ask us to delete it.',
  'Job closed': 'This role has been filled or closed. Your profile stays in our talent pool for similar roles.',
  Withdrawn: 'You withdrew this application.'
};

export const getJobStatus = (job: JobOrder): JobStatus => {
  if (job.state === 'draft') return 'Draft';
  if (job.state === 'filled') return 'Filled';
  if (job.state === 'closed') return 'Closed';
  const d = daysDiff(job.closes);
  if (d < 0) return 'Closed';
  return d <= 7 ? 'Closing soon' : 'Open';
};

export const STATUS_SORT_ORDER: Record<string, number> = {
  Open: 0,
  'Closing soon': 1,
  Filled: 2,
  Closed: 3,
  Draft: 4
};

export const evaluateCandidate = (
  job: JobOrder,
  candidate: Candidate,
  answers?: Record<string, string>,
  knockoutQuestions: KnockoutQuestion[] = []
): EvaluationResult => {
  const crit: EvaluationResult['crit'] = [];
  let mustCount = 0;
  let niceScore = 0;

  // Knockout verification
  if (answers && knockoutQuestions.length) {
    knockoutQuestions.forEach(k => {
      if (answers[k.id] === 'no') {
        crit.push({ t: 'ko', label: k.q, met: false, ev: 'Answered no' });
      }
    });
  }

  const isKoPassed = crit.length === 0;
  const candidateSkills = candidate.skills.map(s => s.toLowerCase());
  const matchSkill = (keys: string[]) => keys.find(k => candidateSkills.some(s => s.includes(k.toLowerCase())));

  // Must-have evaluation
  job.must.forEach(m => {
    const hit = matchSkill(m.keys);
    if (hit) mustCount++;
    crit.push({
      t: 'must',
      label: m.label,
      met: !!hit,
      ev: hit ? 'Found on CV' : 'Not found on CV'
    });
  });

  // Nice-to-have evaluation
  job.nice.forEach(n => {
    const hit = matchSkill(n.keys);
    const weight = n.w || 10;
    if (hit) niceScore += weight;
    crit.push({
      t: 'nice',
      label: `${n.label} (+${weight} points)`,
      met: !!hit,
      ev: hit ? 'Found on CV' : 'Not found on CV'
    });
  });

  // Experience requirement
  const minYears = job.minYears || 1;
  const expMet = candidate.years >= minYears;
  crit.push({
    t: 'exp',
    label: `${minYears}+ years of experience`,
    met: expMet,
    ev: `${candidate.years} years on CV`
  });

  let score = Math.round(
    (60 * (job.must.length > 0 ? mustCount / job.must.length : 1)) +
    niceScore +
    (10 * Math.min(1, candidate.years / minYears))
  );

  if (!isKoPassed) {
    score = Math.min(score, 45);
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    crit,
    ko: isKoPassed,
    must: mustCount
  };
};

export const getScoreClass = (score: number): 'hi' | 'mid' | 'lo' => {
  return score >= 80 ? 'hi' : score >= 60 ? 'mid' : 'lo';
};

export const getScoreColor = (score: number): string => {
  return score >= 80 ? 'var(--good)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
};

export const CV_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const CV_ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-word'
];

export const validateCvFile = (name: string, size: number, type?: string): string => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!['pdf', 'docx', 'doc'].includes(ext)) {
    return `Only PDF, DOCX, or DOC files are accepted. This file is .${ext}.`;
  }
  if (!size) {
    return 'This file is empty. Choose your CV again.';
  }
  if (size > CV_MAX_BYTES) {
    return `This file is ${(size / 1048576).toFixed(1)} MB. The limit is 5 MB.`;
  }
  return '';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1048576) {
    return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }
  return (bytes / 1048576).toFixed(1) + ' MB';
};

export const getJobSlug = (job: { id: string; title: string; slug?: string }): string => {
  if (job.slug && job.slug.trim()) {
    return job.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const cleanTitle = job.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return cleanTitle ? `${cleanTitle}-${job.id.slice(0, 6)}` : job.id;
};

export const getJobApplicationUrl = (
  job: { id: string; title: string; slug?: string },
  directApply?: boolean
): string => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://recruitbyct.com';
  const slug = getJobSlug(job);
  return `${base}/jobs/${slug}${directApply ? '?apply=true' : ''}`;
};
