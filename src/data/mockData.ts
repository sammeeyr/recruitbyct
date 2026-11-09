import { ActivityLogItem, Application, Candidate, Client, DriveLogItem, JobOrder, KnockoutQuestion, Placement } from '../types';
import { addDays } from '../utils/helpers';

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Nexus Microfinance Bank', industry: 'Banking', contact: 'Chinelo Obi', fee: 15, guarantee: 90 },
  { id: 'c2', name: 'Savanna Logistics', industry: 'Logistics', contact: 'Musa Danladi', fee: 12, guarantee: 60 },
  { id: 'c3', name: 'Greenfield Health Group', industry: 'Healthcare', contact: 'Dr. Ada Nnamdi', fee: 15, guarantee: 90 },
  { id: 'c4', name: 'Arewa Digital', industry: 'Technology', contact: 'Yusuf Garba', fee: 10, guarantee: 90 }
];

export const KNOCKOUT_QUESTIONS: KnockoutQuestion[] = [
  { id: 'ko1', q: 'Are you legally able to work in Nigeria?' },
  { id: 'ko2', q: 'Can you start within 30 days of an offer?' },
  { id: 'ko3', q: 'Is the advertised pay range acceptable to you?' }
];

export const INITIAL_JOBS: JobOrder[] = [
  {
    id: 'jo1',
    clientId: 'c1',
    title: 'Customer Success Lead',
    location: 'Abuja',
    type: 'Full-time',
    category: 'Customer service',
    salary: [450000, 600000],
    closes: addDays(12),
    state: 'open',
    approved: true,
    minYears: 5,
    listing: { published: true, confidential: true, showSalary: true },
    summary: 'Own onboarding and retention for a growing base of business and retail customers. You will lead a small team, report on service levels and work with product on what customers need next.',
    duties: [
      'Lead a team of six customer success officers',
      'Run onboarding for new business accounts',
      'Report weekly on retention, complaints and response times',
      'Work with product and operations to close service gaps'
    ],
    must: [
      { label: 'Customer success or service background', keys: ['customer success', 'customer service'] },
      { label: 'CRM tools', keys: ['crm'] },
      { label: 'Service reporting', keys: ['reporting'] }
    ],
    nice: [
      { label: 'Onboarding programmes', keys: ['onboarding'], w: 10 },
      { label: 'Team leadership', keys: ['team leadership'], w: 10 },
      { label: 'Excel', keys: ['excel'], w: 10 }
    ]
  },
  {
    id: 'jo2',
    clientId: 'c2',
    title: 'Fleet Operations Manager',
    location: 'Lagos',
    type: 'Full-time',
    category: 'Logistics',
    salary: [650000, 850000],
    closes: addDays(4),
    state: 'open',
    approved: true,
    minYears: 6,
    listing: { published: true, confidential: false, showSalary: true },
    summary: 'Run a fleet of 120 trucks across the Lagos and Ogun corridors. You own route planning, driver standards and vehicle uptime, and report to the head of operations.',
    duties: [
      'Plan and review daily routes',
      'Keep fleet uptime above 94%',
      'Enforce driver HSE standards',
      'Report weekly on fuel, delays and incidents'
    ],
    must: [
      { label: 'Fleet management', keys: ['fleet management'] },
      { label: 'Logistics operations', keys: ['logistics'] },
      { label: 'Route planning', keys: ['route planning'] }
    ],
    nice: [
      { label: 'HSE standards', keys: ['hse'], w: 10 },
      { label: 'Team leadership', keys: ['team leadership'], w: 10 },
      { label: 'Operations reporting', keys: ['reporting'], w: 10 }
    ]
  },
  {
    id: 'jo3',
    clientId: 'c4',
    title: 'Senior Backend Engineer',
    location: 'Remote',
    type: 'Full-time',
    category: 'Technology',
    salary: [900000, 1300000],
    closes: addDays(20),
    state: 'open',
    approved: true,
    minYears: 5,
    listing: { published: true, confidential: false, showSalary: false },
    summary: 'Build and run the APIs behind a payments platform used by 40,000 merchants. You will review code, mentor two engineers and keep the service fast and observable.',
    duties: [
      'Design and ship Node.js services',
      'Own database performance and migrations',
      'Review pull requests and mentor engineers',
      'Improve deployment and monitoring'
    ],
    must: [
      { label: 'Node.js', keys: ['node.js'] },
      { label: 'PostgreSQL', keys: ['postgresql'] },
      { label: 'TypeScript', keys: ['typescript'] }
    ],
    nice: [
      { label: 'AWS', keys: ['aws'], w: 10 },
      { label: 'Docker', keys: ['docker'], w: 10 },
      { label: 'CI/CD pipelines', keys: ['ci/cd'], w: 10 }
    ]
  },
  {
    id: 'jo4',
    clientId: 'c3',
    title: 'Clinic Administrator',
    location: 'Abuja',
    type: 'Full-time',
    category: 'Healthcare',
    salary: [300000, 420000],
    closes: addDays(15),
    state: 'open',
    approved: true,
    minYears: 4,
    listing: { published: true, confidential: true, showSalary: true },
    summary: 'Keep a busy private clinic running. You manage patient scheduling, front-desk staff and monthly reporting to the medical director.',
    duties: [
      'Manage patient scheduling and records',
      'Supervise four front-desk staff',
      'Produce monthly activity reports',
      'Coordinate supplies with the pharmacy'
    ],
    must: [
      { label: 'Clinic or office administration', keys: ['administration'] },
      { label: 'Patient scheduling', keys: ['patient scheduling'] },
      { label: 'Reporting', keys: ['reporting'] }
    ],
    nice: [
      { label: 'HMIS software', keys: ['hmis'], w: 15 },
      { label: 'Team leadership', keys: ['team leadership'], w: 10 },
      { label: 'Excel', keys: ['excel'], w: 5 }
    ]
  },
  {
    id: 'jo5',
    clientId: 'c1',
    title: 'Accounts Officer',
    location: 'Abuja',
    type: 'Full-time',
    category: 'Finance',
    salary: [350000, 420000],
    closes: addDays(-10),
    state: 'filled',
    approved: true,
    minYears: 3,
    listing: { published: true, confidential: true, showSalary: true },
    summary: 'Process payables, reconcile branch accounts and support the month-end close.',
    duties: [
      'Reconcile branch accounts',
      'Process supplier payments',
      'Support month-end reporting'
    ],
    must: [
      { label: 'Accounting', keys: ['accounting'] },
      { label: 'Reconciliation', keys: ['reconciliation'] },
      { label: 'Excel', keys: ['excel'] }
    ],
    nice: [
      { label: 'ERP systems', keys: ['erp'], w: 15 },
      { label: 'Financial reporting', keys: ['reporting'], w: 15 }
    ]
  },
  {
    id: 'jo6',
    clientId: 'c2',
    title: 'Sales Executive (FMCG)',
    location: 'Lagos',
    type: 'Contract',
    category: 'Sales',
    salary: [250000, 350000],
    closes: addDays(9),
    state: 'open',
    approved: true,
    minYears: 3,
    listing: { published: true, confidential: false, showSalary: true },
    summary: 'Twelve-month contract selling Savanna Logistics warehousing to FMCG distributors in Lagos. Commission on top of base pay.',
    duties: [
      'Prospect and visit distributors',
      'Negotiate and close warehousing contracts',
      'Keep the pipeline current in the CRM',
      'Report weekly to the sales manager'
    ],
    must: [
      { label: 'FMCG sales experience', keys: ['fmcg sales'] },
      { label: 'Distributor management', keys: ['distributor management'] },
      { label: 'Negotiation', keys: ['negotiation'] }
    ],
    nice: [
      { label: 'CRM tools', keys: ['crm'], w: 10 },
      { label: 'Sales reporting', keys: ['reporting'], w: 10 },
      { label: 'Excel', keys: ['excel'], w: 10 }
    ]
  },
  {
    id: 'jo7',
    clientId: 'c1',
    title: 'Compliance Analyst',
    location: 'Abuja',
    type: 'Full-time',
    category: 'Finance',
    salary: [500000, 650000],
    closes: addDays(30),
    state: 'draft',
    approved: false,
    minYears: 4,
    listing: { published: false, confidential: true, showSalary: true },
    summary: 'Monitor transactions, run KYC reviews and report suspicious activity to the compliance head.',
    duties: [
      'Run KYC and AML reviews',
      'Report suspicious transactions',
      'Maintain compliance policies'
    ],
    must: [
      { label: 'Compliance experience', keys: ['compliance'] },
      { label: 'KYC checks', keys: ['kyc'] },
      { label: 'Reporting', keys: ['reporting'] }
    ],
    nice: [
      { label: 'AML monitoring', keys: ['aml'], w: 15 },
      { label: 'Policy writing', keys: ['policy writing'], w: 10 },
      { label: 'Excel', keys: ['excel'], w: 5 }
    ]
  }
];

let candIndex = 0;
const createCand = (
  id: string,
  name: string,
  headline: string,
  loc: string,
  years: number,
  skills: string[],
  sal: number,
  avail: number,
  daysAgoVerified: number
): Candidate => {
  candIndex++;
  return {
    id,
    name,
    headline,
    loc,
    years,
    skills,
    sal,
    avail,
    verified: addDays(-daysAgoVerified),
    drive: 'synced',
    email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
    phone: '0803 555 01' + String(candIndex).padStart(2, '0')
  };
};

export const INITIAL_CANDIDATES: Candidate[] = [
  createCand('k1', 'Ifeoma Chukwu', 'Customer success manager', 'Abuja', 6, ['Customer success', 'CRM', 'Onboarding', 'Reporting', 'Excel'], 520000, 0, 12),
  createCand('k2', 'Emeka Eze', 'Customer service lead', 'Abuja', 8, ['Customer service', 'Team leadership', 'CRM', 'Complaint handling', 'Reporting'], 560000, 14, 30),
  createCand('k3', 'Tunde Bakare', 'Operations analyst', 'Lagos', 4, ['Operations', 'Excel', 'Reporting', 'SQL', 'Customer service'], 380000, 0, 130),
  createCand('k4', 'Amina Yusuf', 'Fleet coordinator', 'Lagos', 7, ['Fleet management', 'Logistics', 'Route planning', 'HSE', 'Team leadership'], 780000, 21, 20),
  createCand('k5', 'Ibrahim Musa', 'Logistics manager', 'Kano', 9, ['Logistics', 'Fleet management', 'Team leadership', 'Reporting', 'Dispatch'], 720000, 30, 45),
  createCand('k6', 'Chidi Okafor', 'Backend engineer', 'Remote', 5, ['Node.js', 'PostgreSQL', 'TypeScript', 'AWS', 'Docker'], 1100000, 30, 9),
  createCand('k7', 'Kelechi Nwosu', 'DevOps engineer', 'Lagos', 6, ['AWS', 'Docker', 'CI/CD', 'Node.js', 'TypeScript', 'Kubernetes'], 1200000, 14, 100),
  createCand('k8', 'Zainab Lawal', 'Full-stack developer', 'Abuja', 3, ['React', 'Node.js', 'MongoDB', 'JavaScript'], 600000, 0, 6),
  createCand('k9', 'Blessing Ade', 'Clinic coordinator', 'Abuja', 5, ['Administration', 'Patient scheduling', 'HMIS', 'Reporting', 'Excel'], 360000, 0, 15),
  createCand('k10', 'Folasade Ojo', 'Hospital administrator', 'Port Harcourt', 8, ['Administration', 'Patient scheduling', 'Team leadership', 'Reporting', 'HMIS'], 400000, 30, 25),
  createCand('k11', 'Samuel Danjuma', 'Accountant', 'Abuja', 5, ['Accounting', 'Reconciliation', 'Excel', 'ERP'], 380000, 0, 40),
  createCand('k12', 'Halima Sani', 'Sales executive', 'Lagos', 4, ['FMCG sales', 'Distributor management', 'Negotiation', 'CRM', 'Excel'], 320000, 7, 18),
  createCand('k13', 'Peter Adeyemi', 'Customer support representative', 'Abuja', 3, ['Customer service', 'CRM', 'Reporting'], 300000, 0, 2),
  createCand('k14', 'Grace Okon', 'Sales representative', 'Lagos', 2, ['FMCG sales', 'Negotiation', 'CRM'], 240000, 0, 3),
  createCand('k15', 'Musa Abdullahi', 'Compliance officer', 'Abuja', 6, ['Compliance', 'KYC', 'AML', 'Reporting', 'Policy writing'], 560000, 30, 70),
  createCand('k16', 'Ngozi Eke', 'Customer experience analyst', 'Lagos', 5, ['Customer success', 'CRM', 'Reporting', 'Excel', 'Onboarding'], 480000, 14, 95)
];

const agoMinutes = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'a1',
    ref: 'CTC-7K4M-92QX',
    jobId: 'jo1',
    candId: 'k1',
    stage: 'shortlisted',
    applied: agoMinutes(6 * 1440),
    updated: agoMinutes(1440),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Ifeoma_Chukwu_CV.pdf',
    notes: 'Very articulate on customer retention. Good culture fit.',
    revealed: false
  },
  {
    id: 'a2',
    ref: 'CTC-5N2R-81HC',
    jobId: 'jo1',
    candId: 'k2',
    stage: 'submitted',
    applied: agoMinutes(9 * 1440),
    updated: agoMinutes(2880),
    source: 'Email',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Emeka_Eze_CV.pdf',
    notes: 'Submitted to Chinelo Obi at Nexus.',
    revealed: false
  },
  {
    id: 'a3',
    ref: 'CTC-9P3T-44XD',
    jobId: 'jo1',
    candId: 'k3',
    stage: 'screening',
    applied: agoMinutes(3 * 1440),
    updated: agoMinutes(2880),
    source: 'WhatsApp',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Tunde_Bakare_CV.pdf',
    notes: 'Needs screening call to clarify CS experience vs ops.',
    revealed: false
  },
  {
    id: 'a4',
    ref: 'CTC-2M6V-73BF',
    jobId: 'jo1',
    candId: 'k13',
    stage: 'new',
    applied: agoMinutes(35),
    updated: agoMinutes(35),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Peter_Adeyemi_CV.pdf',
    notes: '',
    revealed: false
  },
  {
    id: 'a5',
    ref: 'CTC-3H8P-41WD',
    jobId: 'jo2',
    candId: 'k4',
    stage: 'interview',
    applied: agoMinutes(10 * 1440),
    updated: agoMinutes(1440),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Amina_Yusuf_CV.pdf',
    notes: 'Interview scheduled with Musa Danladi for Thursday.',
    revealed: true
  },
  {
    id: 'a6',
    ref: 'CTC-6C9J-27KS',
    jobId: 'jo2',
    candId: 'k5',
    stage: 'submitted',
    applied: agoMinutes(8 * 1440),
    updated: agoMinutes(4320),
    source: 'Upload',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Ibrahim_Musa_CV.pdf',
    notes: 'Waiting for client review.',
    revealed: false
  },
  {
    id: 'a7',
    ref: 'CTC-4T7Y-68MN',
    jobId: 'jo3',
    candId: 'k6',
    stage: 'offer',
    applied: agoMinutes(14 * 1440),
    updated: agoMinutes(1440),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Chidi_Okafor_CV.pdf',
    notes: 'Offer letter prepared at ₦1,150,000.',
    revealed: true
  },
  {
    id: 'a8',
    ref: 'CTC-8R5W-35GA',
    jobId: 'jo3',
    candId: 'k7',
    stage: 'shortlisted',
    applied: agoMinutes(9 * 1440),
    updated: agoMinutes(5760),
    source: 'Email',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Kelechi_Nwosu_CV.pdf',
    notes: 'Strong on cloud infra and automation.',
    revealed: false
  },
  {
    id: 'a9',
    ref: 'CTC-2L9Q-52ZE',
    jobId: 'jo3',
    candId: 'k8',
    stage: 'screening',
    applied: agoMinutes(4 * 1440),
    updated: agoMinutes(5760),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Zainab_Lawal_CV.pdf',
    notes: '',
    revealed: false
  },
  {
    id: 'a10',
    ref: 'CTC-7D4F-19PU',
    jobId: 'jo4',
    candId: 'k9',
    stage: 'shortlisted',
    applied: agoMinutes(7 * 1440),
    updated: agoMinutes(2880),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Blessing_Ade_CV.pdf',
    notes: 'Has HMIS experience in a 40-bed facility.',
    revealed: false
  },
  {
    id: 'a11',
    ref: 'CTC-5X8B-60RT',
    jobId: 'jo4',
    candId: 'k10',
    stage: 'screening',
    applied: agoMinutes(2 * 1440),
    updated: agoMinutes(2880),
    source: 'WhatsApp',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Folasade_Ojo_CV.pdf',
    notes: '',
    revealed: false
  },
  {
    id: 'a12',
    ref: 'CTC-9K2S-77LV',
    jobId: 'jo5',
    candId: 'k11',
    stage: 'placed',
    applied: agoMinutes(40 * 1440),
    updated: agoMinutes(12 * 1440),
    source: 'Email',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Samuel_Danjuma_CV.pdf',
    notes: 'Started on schedule. Invoiced.',
    revealed: true
  },
  {
    id: 'a13',
    ref: 'CTC-4G6H-38YN',
    jobId: 'jo6',
    candId: 'k12',
    stage: 'screening',
    applied: agoMinutes(2 * 1440),
    updated: agoMinutes(1440),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Halima_Sani_CV.pdf',
    notes: 'Solid FMCG sales track record in Lagos mainland.',
    revealed: false
  },
  {
    id: 'a14',
    ref: 'CTC-3Z7E-90QC',
    jobId: 'jo6',
    candId: 'k14',
    stage: 'new',
    applied: agoMinutes(120),
    updated: agoMinutes(120),
    source: 'WhatsApp',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Grace_Okon_CV.pdf',
    notes: '',
    revealed: false
  },
  {
    id: 'a15',
    ref: 'CTC-6W2A-14DJ',
    jobId: 'jo6',
    candId: 'k3',
    stage: 'rejected',
    applied: agoMinutes(12 * 1440),
    updated: agoMinutes(8 * 1440),
    source: 'Careers site',
    answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' },
    file: 'Tunde_Bakare_CV.pdf',
    notes: 'Client looked for more distributor management background.',
    revealed: false,
    prev: 'screening'
  }
];

export const INITIAL_PLACEMENTS: Placement[] = [
  {
    id: 'p1',
    appId: 'a12',
    name: 'Samuel Danjuma',
    title: 'Accounts Officer',
    clientId: 'c1',
    start: addDays(-40),
    salary: 380000,
    guarantee: 90,
    invoice: 'Paid',
    status: 'active'
  },
  {
    id: 'p2',
    name: 'Dayo Alabi',
    title: 'Warehouse Supervisor',
    clientId: 'c2',
    start: addDays(-75),
    salary: 300000,
    guarantee: 60,
    invoice: 'Paid',
    status: 'active'
  },
  {
    id: 'p3',
    name: 'Rita Obong',
    title: 'Billing Specialist',
    clientId: 'c3',
    start: addDays(-20),
    salary: 340000,
    guarantee: 90,
    invoice: 'Sent',
    status: 'left',
    leftDay: 18
  }
];

export const INITIAL_DRIVE_LOGS: DriveLogItem[] = [
  { id: 'd1', file: 'Peter_Adeyemi_CV.pdf', cand: 'Peter Adeyemi', source: 'Careers site', at: agoMinutes(34), status: 'Synced' },
  { id: 'd2', file: 'Grace_Okon_CV.docx', cand: 'Grace Okon', source: 'WhatsApp', at: agoMinutes(119), status: 'Synced' },
  { id: 'd3', file: 'Emeka_Eze_CV_v2.pdf', cand: 'Emeka Eze', source: 'Email', at: agoMinutes(1500), status: 'Duplicate' },
  { id: 'd4', file: 'Scan_0043.pdf', cand: 'Unreadable scan', source: 'Upload', at: agoMinutes(2900), status: 'Needs review' },
  { id: 'd5', file: 'Halima_Sani_CV.pdf', cand: 'Halima Sani', source: 'Careers site', at: agoMinutes(2880), status: 'Synced' },
  { id: 'd6', file: 'Ibrahim_Musa_CV.pdf', cand: 'Ibrahim Musa', source: 'Upload', at: agoMinutes(11520), status: 'Synced' }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  { t: agoMinutes(34), m: 'Peter Adeyemi applied to Customer Success Lead' },
  { t: agoMinutes(120), m: 'Grace Okon applied to Sales Executive (FMCG) by WhatsApp' },
  { t: agoMinutes(1440), m: 'Chidi Okafor moved to Offer for Senior Backend Engineer' },
  { t: agoMinutes(1500), m: 'Amina Yusuf moved to Interview for Fleet Operations Manager' },
  { t: agoMinutes(2880), m: 'Emeka Eze submitted to Nexus Microfinance Bank' }
];

export const FORM_BATCHES = [
  [
    {
      n: 'Blessing Okeke',
      e: 'blessing.okeke@example.com',
      p: '08031112233',
      y: 5,
      s: ['Customer service', 'CRM', 'Reporting'],
      l: 'Abuja',
      f: 'Blessing_Okeke_CV.pdf'
    },
    {
      n: 'Tosin Adebayo',
      e: 'tosin.adebayo@example.com',
      p: '08054445566',
      y: 3,
      s: ['Excel', 'Reporting', 'Accounting'],
      l: 'Lagos',
      f: 'Tosin_Adebayo_Resume.docx'
    }
  ],
  [
    {
      n: 'Hauwa Bello',
      e: 'hauwa.bello@example.com',
      p: '08077778899',
      y: 7,
      s: ['Operations', 'Team leadership', 'Logistics'],
      l: 'Kano',
      f: 'Hauwa_Bello_CV.pdf'
    }
  ]
];

export const LOCATIONS = ['Abuja', 'Lagos', 'Port Harcourt', 'Kano', 'Remote'];
export const CATEGORIES = ['Customer service', 'Logistics', 'Technology', 'Healthcare', 'Finance', 'Sales'];
