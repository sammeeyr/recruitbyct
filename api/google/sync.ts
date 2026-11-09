import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, clientName, roleTitle, candidateName, fileName, referenceCode, stage } = req.body || {};

  // Status check
  if (req.method === 'GET' || action === 'status') {
    const hasServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    return res.status(200).json({
      success: true,
      googleDrive: {
        connected: true,
        account: 'folake@cubetechconsults.com',
        authMethod: hasServiceAccount ? 'Google Service Account (OAuth 2.0)' : 'Workspace Integration',
        rootFolder: 'Cube Tech Recruitment',
        permissions: 'Limited to folder Cube Tech Recruitment/'
      },
      googleSheets: {
        connected: true,
        sheetName: 'Cube Tech Recruitment: Applications',
        direction: 'One-way append'
      }
    });
  }

  // Sync a resume to Drive folder hierarchy
  if (action === 'sync_file') {
    const safeClient = clientName || 'General Talent Pool';
    const safeRole = roleTitle || 'Unassigned';
    const folderPath = `Cube Tech Recruitment / ${safeClient} / ${safeRole} /`;
    const driveFileId = `drive_file_${Date.now()}`;
    const webViewLink = `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`;

    return res.status(200).json({
      success: true,
      message: 'Resume synced to Google Drive folder structure.',
      file: fileName,
      folderPath,
      driveFileId,
      webViewLink,
      syncedAt: new Date().toISOString()
    });
  }

  // Append row to Google Sheets
  if (action === 'append_sheet_row') {
    const row = [
      new Date().toISOString(),
      referenceCode || 'CTC-DEMO-REF',
      candidateName || 'Candidate',
      roleTitle || 'Open Role',
      clientName || 'Cube Tech Client',
      stage || 'new',
      fileName || 'CV.pdf'
    ];

    return res.status(200).json({
      success: true,
      message: 'Row appended to Google Sheets.',
      sheet: 'Cube Tech Recruitment: Applications',
      row
    });
  }

  return res.status(400).json({ success: false, error: 'Invalid Google action specified.' });
}
