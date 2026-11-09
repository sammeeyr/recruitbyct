import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory / serverless mock database
const MOCK_JOBS = [
  {
    id: 'jo1',
    clientId: 'c1',
    title: 'Customer Success Lead',
    location: 'Abuja',
    type: 'Full-time',
    category: 'Customer service',
    salary: [450000, 600000],
    closes: '2026-11-21',
    state: 'open',
    approved: true,
    minYears: 5,
    listing: { published: true, confidential: true, showSalary: true },
    summary: 'Own onboarding and retention for a growing base of business and retail customers.',
    duties: ['Lead a team of six customer success officers', 'Run onboarding for new business accounts'],
    must: [{ label: 'Customer success background', keys: ['customer success', 'customer service'] }],
    nice: [{ label: 'CRM tools', keys: ['crm'], w: 10 }]
  },
  {
    id: 'jo2',
    clientId: 'c2',
    title: 'Fleet Operations Manager',
    location: 'Lagos',
    type: 'Full-time',
    category: 'Logistics',
    salary: [650000, 850000],
    closes: '2026-11-13',
    state: 'open',
    approved: true,
    minYears: 6,
    listing: { published: true, confidential: false, showSalary: true },
    summary: 'Run a fleet of 120 trucks across the Lagos and Ogun corridors.',
    duties: ['Plan and review daily routes', 'Keep fleet uptime above 94%'],
    must: [{ label: 'Fleet management', keys: ['fleet management'] }],
    nice: [{ label: 'HSE standards', keys: ['hse'], w: 10 }]
  },
  {
    id: 'jo3',
    clientId: 'c4',
    title: 'Senior Backend Engineer',
    location: 'Remote',
    type: 'Full-time',
    category: 'Technology',
    salary: [900000, 1300000],
    closes: '2026-11-29',
    state: 'open',
    approved: true,
    minYears: 5,
    listing: { published: true, confidential: false, showSalary: false },
    summary: 'Build and run the APIs behind a payments platform used by 40,000 merchants.',
    duties: ['Design and ship Node.js services', 'Own database performance and migrations'],
    must: [{ label: 'Node.js', keys: ['node.js'] }, { label: 'PostgreSQL', keys: ['postgresql'] }],
    nice: [{ label: 'AWS', keys: ['aws'], w: 10 }]
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { category, location } = req.query;
    let results = MOCK_JOBS.filter(j => j.listing.published && j.state !== 'draft');

    if (category && typeof category === 'string') {
      results = results.filter(j => j.category.toLowerCase() === category.toLowerCase());
    }

    if (location && typeof location === 'string') {
      results = results.filter(j => j.location.toLowerCase() === location.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body || !body.title || !body.clientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title and clientId are required.'
      });
    }

    const newJob = {
      id: `jo${Date.now()}`,
      clientId: body.clientId,
      title: body.title,
      location: body.location || 'Abuja',
      type: body.type || 'Full-time',
      category: body.category || 'Customer service',
      salary: body.salary || [300000, 450000],
      closes: body.closes || new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10),
      state: 'draft',
      approved: false,
      minYears: body.minYears || 3,
      listing: {
        published: false,
        confidential: body.confidential ?? true,
        showSalary: body.showSalary ?? true
      },
      summary: body.summary || `Draft role for ${body.title}.`,
      duties: body.duties || ['Deliver core responsibilities', 'Report weekly progress'],
      must: body.must || [{ label: 'Relevant experience', keys: [body.category?.toLowerCase() || 'service'] }],
      nice: body.nice || [{ label: 'Team leadership', keys: ['leadership'], w: 10 }]
    };

    return res.status(201).json({
      success: true,
      message: 'Job order created as draft scorecard.',
      data: newJob
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
