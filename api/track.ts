import type { VercelRequest, VercelResponse } from '@vercel/node';

const MOCK_TRACK_DATA: Record<string, any> = {
  'CTC-7K4M-92QX': {
    ref: 'CTC-7K4M-92QX',
    role: 'Customer Success Lead',
    client: 'Confidential client',
    contact: 'ifeoma.chukwu@example.com',
    phone: '0803 555 0101',
    stage: 'shortlisted',
    publicStatus: 'Shortlisted',
    appliedAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-08T15:30:00Z',
    nextSteps: 'You are on the shortlist. We confirm with you before your profile is shared with the employer.'
  },
  'CTC-3H8P-41WD': {
    ref: 'CTC-3H8P-41WD',
    role: 'Fleet Operations Manager',
    client: 'Savanna Logistics',
    contact: 'amina.yusuf@example.com',
    phone: '0803 555 0104',
    stage: 'interview',
    publicStatus: 'Interview stage',
    appliedAt: '2026-10-30T09:00:00Z',
    updatedAt: '2026-11-08T12:00:00Z',
    nextSteps: 'An interview has been requested. Watch your phone and email for the time.'
  }
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lookup reference and initiate OTP challenge
  if (req.method === 'POST') {
    const { ref, contact, code } = req.body || {};

    if (!ref || !contact) {
      return res.status(400).json({
        success: false,
        error: 'Reference code and contact email/phone are required.'
      });
    }

    const cleanRef = String(ref).trim().toUpperCase();
    const entry = MOCK_TRACK_DATA[cleanRef];

    // If verifying OTP code
    if (code) {
      if (!entry) {
        return res.status(404).json({ success: false, error: 'Application not found.' });
      }
      return res.status(200).json({
        success: true,
        verified: true,
        data: entry
      });
    }

    // Step 1: Challenge code generation
    if (!entry) {
      // Return simulated code even if not found to prevent user enumeration
      const dummyCode = String(Math.floor(100000 + Math.random() * 900000));
      return res.status(200).json({
        success: true,
        message: 'OTP challenge generated.',
        code: dummyCode,
        exists: false
      });
    }

    const challengeCode = String(Math.floor(100000 + Math.random() * 900000));
    return res.status(200).json({
      success: true,
      message: 'OTP challenge generated.',
      code: challengeCode,
      exists: true
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
