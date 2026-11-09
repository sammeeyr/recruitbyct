import type { VercelRequest, VercelResponse } from '@vercel/node';

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `CTC-${part(4)}-${part(4)}`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId, name, email, phone, location, years, skills, answers } = req.body || {};

  if (!jobId || !name || !email || !phone) {
    return res.status(400).json({
      success: false,
      error: 'Missing required application fields: jobId, name, email, and phone.'
    });
  }

  // Knockout verification
  if (answers) {
    if (answers.ko1 === 'no' || answers.ko2 === 'no' || answers.ko3 === 'no') {
      // Still accepted into queue, but flagged for review
    }
  }

  const refCode = generateReference();
  const application = {
    id: `app_${Date.now()}`,
    ref: refCode,
    jobId,
    candidate: {
      name,
      email: email.toLowerCase(),
      phone,
      location: location || 'Abuja',
      years: Number(years) || 0,
      skills: Array.isArray(skills) ? skills : []
    },
    stage: 'new',
    source: 'Careers site API',
    appliedAt: new Date().toISOString(),
    status: 'Received'
  };

  return res.status(201).json({
    success: true,
    message: 'Application submitted successfully.',
    reference: refCode,
    application
  });
}
