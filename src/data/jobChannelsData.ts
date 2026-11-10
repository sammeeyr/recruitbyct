export interface JobBoardChannel {
  id: string;
  name: string;
  category: 'nigeria' | 'global' | 'apac' | 'emea' | 'tech';
  categoryLabel: string;
  reach: string;
  type: 'Organic' | 'Premium / Sponsored' | 'Pre-Integrated';
  status: 'Live & Synced' | 'Ready to Sync' | 'Sponsored Available';
  description: string;
  sponsoredAvailable: boolean;
  cpcEstimate?: string;
  badge?: string;
}

export const JOB_BOARD_CHANNELS: JobBoardChannel[] = [
  // 1. Nigeria & Local Channels
  {
    id: 'jobberman',
    name: 'Jobberman Nigeria',
    category: 'nigeria',
    categoryLabel: 'Nigeria & Local Channels',
    reach: '2.5M+ Nigerian professionals',
    type: 'Pre-Integrated',
    status: 'Live & Synced',
    description: "Nigeria's #1 online recruitment marketplace. Live XML feed syndication and featured spotlight.",
    sponsoredAvailable: true,
    cpcEstimate: '₦75 - ₦150 / applicant',
    badge: 'Local #1'
  },
  {
    id: 'hotnigerianjobs',
    name: 'HotNigerianJobs',
    category: 'nigeria',
    categoryLabel: 'Nigeria & Local Channels',
    reach: '1.8M monthly visits',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Premier Nigerian job vacancy and career opportunity aggregator with nationwide reach.',
    sponsoredAvailable: false,
    badge: 'High Traffic'
  },
  {
    id: 'myjobmag',
    name: 'MyJobMag Nigeria',
    category: 'nigeria',
    categoryLabel: 'Nigeria & Local Channels',
    reach: '950K+ job seekers',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Specialized Nigerian graduate and executive vacancy portal with automated RSS ingestion.',
    sponsoredAvailable: true,
    cpcEstimate: '₦60 / click'
  },
  {
    id: 'ngcareers',
    name: 'NgCareers',
    category: 'nigeria',
    categoryLabel: 'Nigeria & Local Channels',
    reach: '600K+ registered members',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Leading corporate job and internship platform across Lagos, Abuja, Port Harcourt, and Ibadan.',
    sponsoredAvailable: false
  },
  {
    id: 'allnigeriajobs',
    name: 'AllNigeriaJobs Directory',
    category: 'nigeria',
    categoryLabel: 'Nigeria & Local Channels',
    reach: '450K+ monthly views',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Federal, state, and private sector vacancy syndication network.',
    sponsoredAvailable: false
  },
  {
    id: 'nairaland-careers',
    name: 'NairaLand Career Hub',
    category: 'nigeria',
    categoryLabel: 'Nigeria & Local Channels',
    reach: '3M+ Nigerian community',
    type: 'Organic',
    status: 'Ready to Sync',
    description: "Nigeria's largest online forum career and recruitment section.",
    sponsoredAvailable: false
  },
  {
    id: 'justjobsng',
    name: 'JustJobsNG',
    category: 'nigeria',
    categoryLabel: 'Nigeria & Local Channels',
    reach: '300K+ candidates',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Curated entry-level, mid-level, and senior vacancy syndication.',
    sponsoredAvailable: false
  },

  // 2. Global Organic & Free Aggregators
  {
    id: 'google-jobs',
    name: 'Google for Jobs',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: '100M+ global search queries',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Direct search engine indexation via Schema.org/JobPosting structured JSON-LD data markup.',
    sponsoredAvailable: false,
    badge: 'Native Schema'
  },
  {
    id: 'indeed-organic',
    name: 'Indeed Organic Feed',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: '350M+ global monthly visitors',
    type: 'Organic',
    status: 'Live & Synced',
    description: "World's largest job site. Automated XML feed ingestion for free organic distribution.",
    sponsoredAvailable: true,
    cpcEstimate: '$0.30 - $0.75 / click',
    badge: 'Global #1'
  },
  {
    id: 'linkedin-organic',
    name: 'LinkedIn Limited Listings',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: '1B+ professionals worldwide',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Free indexed job listings visible across LinkedIn search and company profile pages.',
    sponsoredAvailable: true,
    cpcEstimate: '$1.20 - $2.50 / applicant'
  },
  {
    id: 'ziprecruiter-organic',
    name: 'ZipRecruiter Organic Network',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: 'Distributed across 100+ partner job boards',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Syndicates job orders to 100+ employment search engines automatically.',
    sponsoredAvailable: true,
    cpcEstimate: '$0.50 / click'
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor Jobs',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: '55M+ monthly users',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Integrates employer branding, salary insights, and open job orders.',
    sponsoredAvailable: true
  },
  {
    id: 'talent-com',
    name: 'Talent.com (formerly Neuvoo)',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: '40M+ job seekers across 78 countries',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Global job aggregator automatically indexing XML ATS feeds.',
    sponsoredAvailable: true
  },
  {
    id: 'jooble',
    name: 'Jooble',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: 'Operating in 71 countries',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Second most visited job search engine globally with native XML feed ingestion.',
    sponsoredAvailable: false
  },
  {
    id: 'adzuna',
    name: 'Adzuna',
    category: 'global',
    categoryLabel: 'Global Organic Aggregators',
    reach: '20M+ monthly users',
    type: 'Organic',
    status: 'Live & Synced',
    description: 'Search engine for job ads used by the UK and global governments for labor index data.',
    sponsoredAvailable: true
  },

  // 3. APAC & Regional Networks
  {
    id: 'seek',
    name: 'SEEK',
    category: 'apac',
    categoryLabel: 'APAC & Regional Networks',
    reach: 'Australia, New Zealand & APAC leader',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: "Australasia's dominant career portal, driving 70%+ of executive hires in ANZ.",
    sponsoredAvailable: true,
    badge: 'ANZ #1'
  },
  {
    id: 'jobsdb',
    name: 'JobsDB',
    category: 'apac',
    categoryLabel: 'APAC & Regional Networks',
    reach: 'Hong Kong, Singapore, Thailand, Indonesia',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: 'Leading career marketplace in Asia connecting multinationals with regional talent.',
    sponsoredAvailable: true
  },
  {
    id: 'jobstreet',
    name: 'Jobstreet',
    category: 'apac',
    categoryLabel: 'APAC & Regional Networks',
    reach: 'Malaysia, Philippines, Singapore, Indonesia',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: 'Southeast Asia’s largest recruitment platform with 15M+ registered talent.',
    sponsoredAvailable: true,
    badge: 'SEA #1'
  },
  {
    id: 'naukri',
    name: 'Naukri.com',
    category: 'apac',
    categoryLabel: 'APAC & Regional Networks',
    reach: '80M+ registered professionals (India & Gulf)',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: "India's premier employment marketplace and talent database.",
    sponsoredAvailable: true,
    badge: 'India #1'
  },

  // 4. EMEA / UK / Africa
  {
    id: 'cv-library',
    name: 'CV-Library',
    category: 'emea',
    categoryLabel: 'EMEA & UK Channels',
    reach: '18M+ CV database (UK & Ireland)',
    type: 'Pre-Integrated',
    status: 'Live & Synced',
    description: "The UK's largest independent job board with live multi-posting feeds.",
    sponsoredAvailable: true,
    badge: 'UK Independent #1'
  },
  {
    id: 'totaljobs',
    name: 'TotalJobs & StepStone UK',
    category: 'emea',
    categoryLabel: 'EMEA & UK Channels',
    reach: '20M+ monthly job searches',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: 'Major UK commercial job board network covering engineering, finance, and operations.',
    sponsoredAvailable: true
  },
  {
    id: 'pnet',
    name: 'PNet South Africa',
    category: 'emea',
    categoryLabel: 'EMEA & African Networks',
    reach: '5M+ South African job seekers',
    type: 'Pre-Integrated',
    status: 'Live & Synced',
    description: "South Africa's leading online recruitment portal, part of the StepStone group.",
    sponsoredAvailable: true,
    badge: 'South Africa #1'
  },
  {
    id: 'careerjunction',
    name: 'CareerJunction',
    category: 'emea',
    categoryLabel: 'EMEA & African Networks',
    reach: '3M+ South African candidates',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: 'Comprehensive South African employment index and candidate database.',
    sponsoredAvailable: true
  },
  {
    id: 'brightermonday',
    name: 'BrighterMonday (East Africa)',
    category: 'emea',
    categoryLabel: 'EMEA & African Networks',
    reach: 'Kenya, Uganda, Tanzania',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: 'East Africa’s largest job platform, sister network to Jobberman.',
    sponsoredAvailable: true
  },

  // 5. Tech & Remote Specialized
  {
    id: 'remoteok',
    name: 'RemoteOK',
    category: 'tech',
    categoryLabel: 'Tech & Remote Specialized',
    reach: '2M+ remote tech workers',
    type: 'Pre-Integrated',
    status: 'Live & Synced',
    description: 'Targeted global audience for software engineers, product managers, and growth specialists.',
    sponsoredAvailable: true
  },
  {
    id: 'weworkremotely',
    name: 'WeWorkRemotely',
    category: 'tech',
    categoryLabel: 'Tech & Remote Specialized',
    reach: '4.5M+ visitors monthly',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: "The world's largest remote work community.",
    sponsoredAvailable: true
  },
  {
    id: 'wellfound',
    name: 'Wellfound (AngelList Talent)',
    category: 'tech',
    categoryLabel: 'Tech & Remote Specialized',
    reach: '10M+ startup and tech candidates',
    type: 'Pre-Integrated',
    status: 'Ready to Sync',
    description: 'Top ecosystem for high-growth tech startups and venture-backed companies.',
    sponsoredAvailable: true
  }
];

export interface SponsoredCampaign {
  id: string;
  jobId: string;
  jobTitle: string;
  channels: string[];
  budgetNaira: number;
  spentNaira: number;
  durationDays: number;
  startDate: string;
  status: 'Active' | 'Pacing Well' | 'Completed' | 'Draft';
  impressions: number;
  clicks: number;
  applications: number;
  cpc: number;
  cpa: number;
}

export const INITIAL_SPONSORED_CAMPAIGNS: SponsoredCampaign[] = [
  {
    id: 'camp_1',
    jobId: 'd04455b6-a2d7-49e3-b1da-0c5b7aa4343c',
    jobTitle: 'Customer Experience / Growth Strategist',
    channels: ['LinkedIn Sponsored', 'Indeed Sponsored', 'Jobberman Spotlight'],
    budgetNaira: 85000,
    spentNaira: 42350,
    durationDays: 14,
    startDate: '2026-11-08',
    status: 'Pacing Well',
    impressions: 24800,
    clicks: 685,
    applications: 26,
    cpc: 61.8,
    cpa: 1628
  }
];
