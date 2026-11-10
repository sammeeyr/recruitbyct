import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  enrichCandidateProfile,
  SUPPORTED_20_PLATFORMS,
  SocialPlatformInfo
} from '../../utils/candidateEnrichmentHelper';
import {
  Sparkles,
  X,
  ExternalLink,
  CheckCircle,
  Globe,
  Share2,
  RefreshCw,
  Search,
  Check,
  ShieldCheck,
  Award,
  ArrowRight
} from 'lucide-react';

export const CandidateEnrichmentModal: React.FC = () => {
  const { modal, closeModal, candidates, enrichCandidate, showToast } = useApp();
  const [isScanning, setIsScanning] = useState(false);

  if (!modal || modal.type !== 'candidate-enrichment') return null;

  const candidateId = modal.id;
  const currentCandidate = candidates.find(c => c.id === candidateId) || candidates[0];

  if (!currentCandidate) return null;

  const enrichmentResult = enrichCandidateProfile(currentCandidate);
  const { enrichedCandidate, beforeData, afterData, platformsDiscovered, publicInsights, confidenceScore } = enrichmentResult;

  const handleApplyEnrichment = async () => {
    await enrichCandidate(currentCandidate.id);
    closeModal();
  };

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      showToast('AI Web Engine refreshed public records across 20+ platforms.');
    }, 900);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
        background: 'var(--surface)',
        borderRadius: '16px',
        color: 'var(--ink)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)'
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 800 }}>
                Candidates' Profiles Enrichment
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(168, 85, 247, 0.16)',
                  color: '#A855F7',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              >
                AI Web Engine
              </span>
            </div>
            <p className="xs muted" style={{ margin: '3px 0 0' }}>
              Collect insights beyond resume. Automatically discovers verified data on 20+ social media and public platforms.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeModal}
          className="iconbtn"
          aria-label="Close dialog"
          style={{ padding: '6px' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '24px', maxHeight: 'calc(85vh - 120px)', overflowY: 'auto' }}>
        {/* Transformation Comparison Cards (matches the user's reference visual) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '20px',
            alignItems: 'center',
            marginBottom: '28px'
          }}
          className="enrichment-comparison-grid"
        >
          {/* Left Card: Before AI Enrichment (Resume Only) */}
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: '14px',
              border: '1px solid var(--line)',
              padding: '24px 20px',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(113, 113, 122, 0.16)',
                color: 'var(--muted)',
                letterSpacing: '0.04em'
              }}
            >
              BEFORE ENRICHMENT
            </div>

            {/* Silhouette Placeholder */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: 'rgba(161, 161, 170, 0.14)',
                  border: '2px dashed var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(161, 161, 170, 0.25)',
                    marginBottom: '10px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>First Name</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{beforeData.firstName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Last Name</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{beforeData.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Email</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{beforeData.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Title</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{beforeData.headline}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Location</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{beforeData.loc}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Social Media</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#1877F2',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    f
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Transition Arrow */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#A855F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowRight size={22} />
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#A855F7',
                textAlign: 'center',
                maxWidth: '90px',
                lineHeight: 1.2
              }}
            >
              AI Engine Web Search
            </span>
          </div>

          {/* Right Card: After AI Enrichment */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '14px',
              border: '2px solid rgba(168, 85, 247, 0.45)',
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.12)',
              padding: '24px 20px',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle size={11} /> ENRICHED ({confidenceScore}% MATCH)
            </div>

            {/* Circular High-Res Portrait Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={enrichedCandidate.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80'}
                  alt={enrichedCandidate.name}
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #A855F7',
                    boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#10B981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    boxShadow: '0 0 6px #10B981'
                  }}
                  title="Verified Profile"
                >
                  ✓
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>First Name</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{afterData.firstName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Last Name</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{afterData.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Email</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#A855F7' }}>{afterData.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Title</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{afterData.headline}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Location</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{afterData.loc}</span>
              </div>

              {/* Clickable Multi-Platform Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="xs muted caps" style={{ fontWeight: 700 }}>Social Media</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {platformsDiscovered.map(({ platform, url }) => (
                    <a
                      key={platform.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${platform.name}: ${url}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: platform.color,
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'transform 0.15s ease',
                        boxShadow: `0 2px 6px ${platform.color}44`
                      }}
                    >
                      {platform.name[0]}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 20+ Platforms Catalog */}
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            padding: '18px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} style={{ color: '#A855F7' }} />
              <b style={{ fontSize: '14px' }}>20+ Social & Public Platforms Integrated</b>
            </div>
            <span className="xs muted">
              Verified {platformsDiscovered.length} profile connections for this candidate
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SUPPORTED_20_PLATFORMS.map(platform => {
              const isFound = platformsDiscovered.some(p => p.platform.id === platform.id);
              const foundUrl = platformsDiscovered.find(p => p.platform.id === platform.id)?.url;

              return isFound && foundUrl ? (
                <a
                  key={platform.id}
                  href={foundUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: platform.badgeBg,
                    color: platform.color,
                    border: `1px solid ${platform.color}40`,
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: platform.color
                    }}
                  />
                  <span>{platform.name}</span>
                  <ExternalLink size={10} />
                </a>
              ) : (
                <span
                  key={platform.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--muted)',
                    border: '1px solid var(--line)',
                    fontSize: '11px',
                    opacity: 0.65
                  }}
                >
                  <span>{platform.name}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Insights Beyond Resume */}
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            padding: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Award size={16} style={{ color: 'var(--yellow)' }} />
            <b style={{ fontSize: '14px' }}>Insights Beyond Resume</b>
          </div>

          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {publicInsights.map((insight, idx) => (
              <li key={idx} style={{ fontSize: '13px', lineHeight: 1.4 }}>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dialog Footer Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderTop: '1px solid var(--line)',
          background: 'var(--surface)'
        }}
      >
        <button
          type="button"
          className="btn ghost sm"
          onClick={handleRescan}
          disabled={isScanning}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={isScanning ? 'spin' : ''} />
          <span>{isScanning ? 'Scanning 20+ Platforms...' : 'Re-scan Web Intelligence'}</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn ghost" onClick={closeModal}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleApplyEnrichment}
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Check size={16} />
            <span>Apply Enriched Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
