import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JOB_BOARD_CHANNELS, INITIAL_SPONSORED_CAMPAIGNS, JobBoardChannel, SponsoredCampaign } from '../../data/jobChannelsData';
import { formatNaira, getJobApplicationUrl } from '../../utils/helpers';
import {
  X,
  Globe,
  Zap,
  TrendingUp,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  Share2
} from 'lucide-react';
import { LinkedinIcon } from '../common/LinkedinIcon';

export const JobChannelsModal: React.FC = () => {
  const { modal, closeModal, jobs, clients, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'organic' | 'sponsored' | 'setup'>('organic');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [channelSearch, setChannelSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Target job context
  const targetJobId = modal?.jobId || modal?.id || jobs[0]?.id;
  const [currentJobId, setCurrentJobId] = useState<string>(targetJobId || '');

  const job = jobs.find(j => j.id === currentJobId) || jobs[0];
  const client = job ? clients.find(c => c.id === job.clientId) : null;

  // Sponsored campaign builder state
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'LinkedIn Sponsored',
    'Indeed Sponsored',
    'Jobberman Spotlight'
  ]);
  const [campaignBudget, setCampaignBudget] = useState<number>(85000);
  const [campaignDuration, setCampaignDuration] = useState<number>(14);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [campaigns, setCampaigns] = useState<SponsoredCampaign[]>(INITIAL_SPONSORED_CAMPAIGNS);

  if (!modal || modal.type !== 'job-channels') return null;

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      showToast(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      showToast(`Copied ${label}`);
    }
  };

  const toggleChannelSelection = (ch: string) => {
    if (selectedChannels.includes(ch)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(prev => prev.filter(c => c !== ch));
      }
    } else {
      setSelectedChannels(prev => [...prev, ch]);
    }
  };

  const handleLaunchCampaign = () => {
    setIsLaunchingCampaign(true);
    setTimeout(() => {
      const newCampaign: SponsoredCampaign = {
        id: `camp_${Date.now()}`,
        jobId: job?.id || 'job_1',
        jobTitle: job?.title || 'Job Opening',
        channels: selectedChannels,
        budgetNaira: campaignBudget,
        spentNaira: 0,
        durationDays: campaignDuration,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        impressions: 120,
        clicks: 8,
        applications: 1,
        cpc: 0,
        cpa: 0
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      setIsLaunchingCampaign(false);
      showToast(`Sponsored campaign launched for ${job?.title || 'role'}!`);
      setActiveTab('sponsored');
    }, 1200);
  };

  // Filter channels
  const filteredChannels = JOB_BOARD_CHANNELS.filter(ch => {
    if (selectedCategory !== 'all' && ch.category !== selectedCategory) return false;
    if (channelSearch.trim()) {
      const q = channelSearch.toLowerCase();
      return ch.name.toLowerCase().includes(q) || ch.description.toLowerCase().includes(q) || ch.categoryLabel.toLowerCase().includes(q);
    }
    return true;
  });

  const indeedFeedUrl = 'https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/feeds/indeed.xml';
  const rssFeedUrl = 'https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/feeds/jobs.xml';
  const jsonFeedUrl = 'https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/feeds/jobs.json';

  return (
    <div style={{ maxWidth: '980px', width: '100%' }}>
      <button
        type="button"
        className="btn ghost sm close"
        onClick={closeModal}
        aria-label="Close"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              <Globe size={12} /> 2,500+ Organic & Premium Channels
            </span>
            <span className="xs muted">· Programmatic Job Multi-Posting Network</span>
          </div>

          <h2 style={{ fontSize: '22px', margin: '2px 0 4px' }}>
            Multi-Channel Syndication & Sponsored Advertising
          </h2>
          <p className="muted xs" style={{ margin: 0 }}>
            Share job openings across 2,500+ global, local, and specialized job platforms (Indeed, LinkedIn, Jobberman, Monster, ZipRecruiter, SEEK, JobsDB, Jobstreet, Naukri, CV-Library, PNet).
          </p>
        </div>

        {/* Job Order Selector */}
        {jobs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <span className="xs muted" style={{ fontWeight: 600 }}>Active Role:</span>
            <select
              value={currentJobId}
              onChange={e => setCurrentJobId(e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.location})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`btn sm ${activeTab === 'organic' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('organic')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Globe size={15} /> 2,500+ Organic Channels ({JOB_BOARD_CHANNELS.length}+ Pre-configured)
        </button>

        <button
          type="button"
          className={`btn sm ${activeTab === 'sponsored' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('sponsored')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Zap size={15} style={{ color: '#F59E0B' }} /> Sponsored Advertising Campaigns
        </button>

        <button
          type="button"
          className={`btn sm ${activeTab === 'setup' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('setup')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Radio size={15} /> Syndication Feeds & Setup Guide
        </button>
      </div>

      {/* ================= TAB 1: 2,500+ ORGANIC CHANNELS ================= */}
      {activeTab === 'organic' && (
        <div>
          {/* Status Banner */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={18} />
              </div>
              <div>
                <b style={{ fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Multi-Channel Organic Syndication: Active
                </b>
                <p className="xs muted" style={{ margin: 0 }}>
                  Published jobs are automatically indexed via Google for Jobs JSON-LD, Indeed XML, and programmatic RSS feeds across 2,500+ organic boards.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => handleCopy(getJobApplicationUrl(job), 'Shareable URL')}
                style={{ fontSize: '12px' }}
              >
                <Copy size={13} /> Copy Direct URL
              </button>
              <button
                type="button"
                className="btn primary sm"
                onClick={() => setActiveTab('sponsored')}
                style={{ fontSize: '12px', background: '#F59E0B', borderColor: '#F59E0B', color: '#1A1400' }}
              >
                <Zap size={13} /> Boost with Sponsored Ads
              </button>
            </div>
          </div>

          {/* Search and Category Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All Channels (2,500+)' },
                { key: 'nigeria', label: 'Nigeria & Local' },
                { key: 'global', label: 'Global Aggregators' },
                { key: 'apac', label: 'APAC & Regional' },
                { key: 'emea', label: 'EMEA & UK' },
                { key: 'tech', label: 'Tech & Remote' }
              ].map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: selectedCategory === cat.key ? 'var(--yellow)' : 'transparent',
                    color: selectedCategory === cat.key ? '#1A1400' : 'var(--ink)'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search job boards..."
                value={channelSearch}
                onChange={e => setChannelSearch(e.target.value)}
                style={{ paddingLeft: '30px', fontSize: '12px', height: '32px' }}
              />
            </div>
          </div>

          {/* Channels Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px', maxHeight: '52vh', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredChannels.map(ch => (
              <div
                key={ch.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <b style={{ fontSize: '14px' }}>{ch.name}</b>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: ch.status === 'Live & Synced' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 204, 0, 0.1)',
                        color: ch.status === 'Live & Synced' ? '#10B981' : 'var(--yellow)',
                        border: `1px solid ${ch.status === 'Live & Synced' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 204, 0, 0.25)'}`
                      }}
                    >
                      {ch.status}
                    </span>
                  </div>

                  <p className="xs muted" style={{ margin: '0 0 8px', lineHeight: '1.4' }}>
                    {ch.description}
                  </p>

                  <div className="xs" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={11} /> Reach: <b style={{ color: 'var(--ink)' }}>{ch.reach}</b>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed var(--line)' }}>
                  <span className="xs muted font-mono">{ch.type}</span>
                  {ch.sponsoredAvailable ? (
                    <button
                      type="button"
                      className="linkbtn xs"
                      onClick={() => {
                        setSelectedChannels([ch.name]);
                        setActiveTab('sponsored');
                      }}
                      style={{ color: '#F59E0B' }}
                    >
                      Sponsor on {ch.name.split(' ')[0]} →
                    </button>
                  ) : (
                    <span className="xs" style={{ color: '#10B981' }}>✓ Included Free</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SPONSORED JOB ADVERTISING CAMPAIGNS ================= */}
      {activeTab === 'sponsored' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Campaigns Tracker */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: '#10B981' }} />
                <h3 style={{ margin: 0, fontSize: '15px' }}>Active Sponsored Campaigns</h3>
              </div>
              <span className="xs muted">Live CPC/CPA Pacing</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px' }}>Campaign & Role</th>
                    <th style={{ padding: '8px 6px' }}>Target Channels</th>
                    <th style={{ padding: '8px 6px' }}>Budget</th>
                    <th style={{ padding: '8px 6px' }}>Spent</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Impressions</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Clicks</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Applicants</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(camp => (
                    <tr key={camp.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '10px 6px', fontWeight: 600 }}>{camp.jobTitle}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {camp.channels.map(c => (
                            <span key={c} style={{ fontSize: '10px', background: 'var(--surface-2)', padding: '2px 5px', borderRadius: '4px' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 6px' }}>{formatNaira(camp.budgetNaira)}</td>
                      <td style={{ padding: '10px 6px', color: 'var(--muted)' }}>{formatNaira(camp.spentNaira)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>{camp.impressions.toLocaleString()}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>{camp.clicks}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>{camp.applications}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Campaign Builder Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={18} style={{ color: '#F59E0B' }} />
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                Launch Sponsored Campaign for: <span style={{ color: '#F59E0B' }}>{job?.title}</span>
              </h3>
            </div>

            {/* Step 1: Channel Mix */}
            <div style={{ marginBottom: '16px' }}>
              <label className="xs muted" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                1. Select Sponsored Advertising Channels:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { name: 'LinkedIn Sponsored', est: '+20,000 targeted views', icon: LinkedinIcon, color: '#0A66C2' },
                  { name: 'Indeed Sponsored', est: 'Top-of-search placement', icon: Globe, color: '#2164F3' },
                  { name: 'Jobberman Spotlight', est: '#1 banner across Nigeria', icon: Sparkles, color: '#10B981' },
                  { name: 'ZipRecruiter Boost', est: '100+ partner network', icon: Layers, color: '#8B5CF6' }
                ].map(opt => {
                  const isSelected = selectedChannels.includes(opt.name);
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => toggleChannelSelection(opt.name)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isSelected ? opt.color : 'var(--line)'}`,
                        background: isSelected ? `${opt.color}10` : 'var(--surface-2)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `1.5px solid ${isSelected ? opt.color : 'var(--muted)'}`,
                          background: isSelected ? opt.color : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div>
                        <b style={{ fontSize: '13px', display: 'block' }}>{opt.name}</b>
                        <span className="xs muted">{opt.est}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Budget Tiers */}
            <div style={{ marginBottom: '16px' }}>
              <label className="xs muted" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                2. Select Campaign Budget Tier:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { title: 'Starter Spotlight', budget: 35000, estReach: '12K - 18K views', estApps: '30 - 50 applicants' },
                  { title: 'Growth Accelerator (Recommended)', budget: 85000, estReach: '28K - 45K views', estApps: '75 - 120 applicants', rec: true },
                  { title: 'Executive Scale', budget: 185000, estReach: '75K+ views', estApps: '180+ applicants' }
                ].map(tier => {
                  const isSelected = campaignBudget === tier.budget;
                  return (
                    <button
                      key={tier.title}
                      type="button"
                      onClick={() => setCampaignBudget(tier.budget)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? 'var(--yellow)' : 'var(--line)'}`,
                        background: isSelected ? 'rgba(255, 204, 0, 0.08)' : 'var(--surface-2)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="xs muted" style={{ fontWeight: 600 }}>{tier.title}</span>
                        {tier.rec && <span className="chip good" style={{ fontSize: '9px', padding: '1px 5px' }}>Best Value</span>}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 4px', color: 'var(--ink)' }}>
                        {formatNaira(tier.budget)}
                      </div>
                      <div className="xs muted">{tier.estReach} · {tier.estApps}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Duration & Launch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="xs muted" style={{ fontWeight: 600 }}>Duration:</span>
                <select
                  value={campaignDuration}
                  onChange={e => setCampaignDuration(Number(e.target.value))}
                  style={{ fontSize: '12px', padding: '5px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '4px' }}
                >
                  <option value={7}>7 Days Campaign</option>
                  <option value={14}>14 Days Campaign</option>
                  <option value={30}>30 Days Campaign</option>
                </select>
                <span className="xs muted">Daily pacing: ~{formatNaira(Math.round(campaignBudget / campaignDuration))}/day</span>
              </div>

              <button
                type="button"
                className="btn primary"
                disabled={isLaunchingCampaign}
                onClick={handleLaunchCampaign}
                style={{ background: '#F59E0B', borderColor: '#F59E0B', color: '#1A1400', padding: '8px 24px', fontWeight: 700 }}
              >
                {isLaunchingCampaign ? 'Launching Sponsored Ads...' : `Launch Campaign (${formatNaira(campaignBudget)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SYNDICATION FEEDS & SETUP GUIDE ================= */}
      {activeTab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Feeds Card */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Live Syndication Feeds (XML & JSON)</h3>
            <p className="xs muted" style={{ marginBottom: '14px' }}>
              Submit these live feed endpoints to Indeed, ZipRecruiter, Jobberman, Jooble, or your programmatic job distribution partners to syndicate jobs automatically.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Indeed XML Job Feed', url: indeedFeedUrl, desc: 'Conforms to official Indeed XML schema' },
                { label: 'Standard ATS RSS/XML Feed', url: rssFeedUrl, desc: 'Generic XML feed consumed by 2,500+ aggregators' },
                { label: 'Programmatic Multi-Posting JSON Feed', url: jsonFeedUrl, desc: 'REST JSON feed for custom distributors & APIs' }
              ].map(f => (
                <div
                  key={f.label}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <b style={{ fontSize: '12px' }}>{f.label}</b>
                      <span className="xs muted">· {f.desc}</span>
                    </div>
                    <code style={{ fontSize: '11px', color: '#0A66C2', wordBreak: 'break-all' }}>{f.url}</code>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => handleCopy(f.url, f.label)}
                    >
                      {copiedKey === f.label ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn ghost sm"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Guide Breakdown */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>What Do We Need to Get It Properly Set?</h3>
            <p className="xs muted" style={{ marginBottom: '16px' }}>
              Everything in Recruitbyct is already engineered for zero-friction distribution. Below is the exact operational checklist for both organic and premium networks:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '12px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <CheckCircle size={15} /> 1. Google for Jobs (Already 100% Live)
                </b>
                <p className="muted" style={{ margin: 0, lineHeight: '1.5' }}>
                  Every job order automatically renders valid <code>Schema.org/JobPosting</code> structured JSON-LD. Googlebot indexes your jobs for local Nigerian and international search without needing an account or paying fees.
                </p>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ color: '#0A66C2', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <LinkedinIcon size={15} /> 2. LinkedIn Multi-Channel Posting
                </b>
                <p className="muted" style={{ margin: 0, lineHeight: '1.5' }}>
                  Use the 1-Click <b>"Share on LinkedIn"</b> modal to publish to your recruiter and company page, or connect your LinkedIn Recruiter contract to trigger sponsored Easy Apply campaigns.
                </p>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Globe size={15} /> 3. Indeed & Organic Aggregator Feeds
                </b>
                <p className="muted" style={{ margin: 0, lineHeight: '1.5' }}>
                  Copy your live Indeed XML feed URL (<code>/feeds/indeed.xml</code>) and submit it once to your Indeed Employer representative or ATS partner portal for continuous auto-sync.
                </p>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Layers size={15} /> 4. Programmatic Multi-Posters (2,500+ Boards)
                </b>
                <p className="muted" style={{ margin: 0, lineHeight: '1.5' }}>
                  If you have existing subscriptions with distributors like <b>Broadbean</b>, <b>Idibu</b>, <b>eQuest</b>, or <b>Joveo</b>, plug their API tokens into Recruitbyct to syndicate across all 2,500+ specialized niche boards simultaneously.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
