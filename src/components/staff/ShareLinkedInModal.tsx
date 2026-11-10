import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LinkedinIcon } from '../common/LinkedinIcon';
import { formatNaira } from '../../utils/helpers';
import { X, Copy, ExternalLink, Sparkles, Check, Share2 } from 'lucide-react';

export const ShareLinkedInModal: React.FC = () => {
  const { modal, closeModal, jobs, clients, showToast } = useApp();

  if (!modal || modal.type !== 'share-linkedin') return null;

  const job = jobs.find(j => j.id === modal.jobId || j.id === modal.id);
  if (!job) return null;

  const client = clients.find(c => c.id === job.clientId);
  const clientDisplay = job.listing.confidential
    ? `Confidential Client · ${client?.industry || 'Enterprise'}`
    : client?.name || 'Cube Tech Consults Client';

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://recruitbyct.com';
  const careersUrl = `${baseUrl}/careers?job=${job.id}`;

  const defaultHashtags = [
    '#CubeTechConsults',
    '#Hiring',
    '#Recruitment',
    `#${(job.category || 'Tech').replace(/[^a-zA-Z0-9]/g, '')}Jobs`,
    '#JobOpening',
    '#NigeriaJobs'
  ].join(' ');

  const generateDefaultPost = () => {
    const payText = job.listing.showSalary
      ? `${formatNaira(job.salary[0])} - ${formatNaira(job.salary[1])} / month`
      : 'Competitive (Disclosed upon interview)';

    const keySkills = [...job.must]
      .slice(0, 3)
      .map(m => `• ${m.label}`)
      .join('\n');

    return `🚀 We're Hiring at Cube Tech Consults!

Role: ${job.title}
Client: ${clientDisplay}
Location: ${job.location} (${job.type})
Pay: ${payText}

Key Requirements:
${keySkills}
• ${job.minYears}+ years of relevant experience

👉 Apply directly on our official Careers Portal:
${careersUrl}

${defaultHashtags}`;
  };

  const [postText, setPostText] = useState(generateDefaultPost());
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPost = () => {
    navigator.clipboard.writeText(postText);
    setCopiedText(true);
    showToast('LinkedIn announcement copy copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(careersUrl);
    setCopiedLink(true);
    showToast('Careers job link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLaunchShareDialog = () => {
    // Copy the prepared text so user can simply paste into LinkedIn's share window
    navigator.clipboard.writeText(postText);
    showToast('Copied post copy to clipboard! Opening LinkedIn share dialog...');

    const shareEndpoint = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(careersUrl)}`;
    const popupWidth = 620;
    const popupHeight = 650;
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;

    window.open(
      shareEndpoint,
      'LinkedInShare',
      `width=${popupWidth},height=${popupHeight},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  return (
    <>
      <button
        type="button"
        className="btn ghost sm close"
        onClick={closeModal}
        aria-label="Close"
      >
        <X size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(10, 102, 194, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LinkedinIcon size={18} style={{ color: '#0A66C2' }} />
        </div>
        <div>
          <span className="xs caps" style={{ letterSpacing: '.1em', color: '#0A66C2', fontWeight: 600 }}>
            LinkedIn Talent Solutions & Social Share
          </span>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Share Role on LinkedIn</h2>
        </div>
      </div>

      <p className="sm muted" style={{ marginBottom: '14px' }}>
        Launch a verified social broadcast to your LinkedIn network and company page followers. The post is pre-filled with job specifications and direct application tracking.
      </p>

      {/* Role Summary Pill */}
      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <b style={{ fontSize: '14px' }}>{job.title}</b>
          <div className="xs muted" style={{ marginTop: '2px' }}>
            {clientDisplay} · {job.location} ({job.type})
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="chip good" style={{ fontSize: '11px' }}>
            {job.state.toUpperCase()}
          </span>
          <div className="xs mono muted" style={{ marginTop: '2px' }}>
            {formatNaira(job.salary[0])} - {formatNaira(job.salary[1])}
          </div>
        </div>
      </div>

      {/* Editable Post Draft */}
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label htmlFor="li-post-text" style={{ fontSize: '12px', fontWeight: 600 }}>
            LinkedIn Announcement Copy
          </label>
          <button
            type="button"
            className="linkbtn xs"
            onClick={() => setPostText(generateDefaultPost())}
            style={{ color: '#0A66C2', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <Sparkles size={11} /> Reset Copy
          </button>
        </div>
        <textarea
          id="li-post-text"
          rows={9}
          value={postText}
          onChange={e => setPostText(e.target.value)}
          style={{
            fontFamily: 'var(--body)',
            fontSize: '13px',
            lineHeight: 1.5,
            width: '100%',
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}
        />
        <div className="xs muted" style={{ marginTop: '4px' }}>
          When you click <b>Share on LinkedIn</b>, this copy is copied to your clipboard so you can paste it directly into the LinkedIn post composer.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn primary"
          onClick={handleLaunchShareDialog}
          style={{
            background: '#0A66C2',
            borderColor: '#0A66C2',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600
          }}
        >
          <Share2 size={14} /> Share on LinkedIn
        </button>

        <button
          type="button"
          className="btn ghost sm"
          onClick={handleCopyPost}
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          {copiedText ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
          {copiedText ? 'Copied Post!' : 'Copy Copy'}
        </button>

        <button
          type="button"
          className="btn ghost sm"
          onClick={handleCopyLink}
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          {copiedLink ? <Check size={13} style={{ color: '#10B981' }} /> : <ExternalLink size={13} />}
          {copiedLink ? 'Copied Link!' : 'Copy Apply Link'}
        </button>
      </div>
    </>
  );
};
