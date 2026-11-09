import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatFileSize, validateCvFile } from '../../utils/helpers';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sliders,
  Users,
  ArrowRight,
  RefreshCw,
  Trash2,
  Check
} from 'lucide-react';

interface ScannedCandidate {
  id: string;
  fileName: string;
  fileSize: number;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  yearsExperience: number;
  extractedSkills: string[];
  missingSkills: string[];
  fitScore: number;
  verdict: 'shortlisted' | 'review' | 'disqualified';
  highlights: string;
  selected: boolean;
}

export const ResumeBatchScreeningModal: React.FC = () => {
  const { modal, closeModal, jobs, importBatchCandidates, setPipeJobId, navigate } = useApp();

  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    if (modal && modal.type === 'resume-import' && modal.jobId) return modal.jobId;
    return jobs[0]?.id || '';
  });

  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId), [jobs, selectedJobId]);

  // Customized Screening Rules
  const [mustSkillsInput, setMustSkillsInput] = useState<string>(() => {
    if (selectedJob && selectedJob.must) {
      return selectedJob.must.map(m => m.label).join(', ');
    }
    return 'Customer Service, Communication, Escalations, CRM';
  });

  const [niceSkillsInput, setNiceSkillsInput] = useState<string>(() => {
    if (selectedJob && selectedJob.nice) {
      return selectedJob.nice.map(n => n.label).join(', ');
    }
    return 'Zendesk, Excel, Quality Assurance, Team Leadership';
  });

  const [minYearsReq, setMinYearsReq] = useState<number>(selectedJob?.minYears || 2);
  const [targetLocation, setTargetLocation] = useState<string>(selectedJob?.location || 'Any');
  const [passThreshold, setPassThreshold] = useState<number>(70);
  const [degreeKnockout, setDegreeKnockout] = useState<boolean>(false);

  // Files & Scanning State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResults, setScannedResults] = useState<ScannedCandidate[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'shortlisted' | 'review' | 'disqualified'>('all');

  if (!modal || modal.type !== 'resume-import') return null;

  // Handle Multi-file Upload (up to 10 resumes)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (uploadedFiles.length + files.length > 10) {
      setFileError('You can upload a maximum of 10 resumes per scan.');
      return;
    }

    const validNewFiles: File[] = [];
    for (const f of files) {
      const err = validateCvFile(f.name, f.size, f.type);
      if (err) {
        setFileError(`${f.name}: ${err}`);
        return;
      }
      validNewFiles.push(f);
    }

    setFileError('');
    setUploadedFiles(prev => [...prev, ...validNewFiles].slice(0, 10));
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Load Sample Batch for instant demo testing
  const handleLoadSampleBatch = () => {
    const sampleNames = [
      'Ngozi Eze - Operations & Customer Lead',
      'Babajide Adeleke - Senior Client Success',
      'Fatima Sanusi - BPO Customer Escalation Specialist',
      'Emeka Okafor - Support Representative & CRM',
      'Aisha Bello - Front Desk & Office Coordinator',
      'Tunde Balogun - Call Center Operations Analyst'
    ];

    const mockCandidates: ScannedCandidate[] = [
      {
        id: 'scan-1',
        fileName: 'Ngozi_Eze_Resume_2026.pdf',
        fileSize: 420000,
        fullName: 'Ngozi Eze',
        email: 'ngozi.eze@samplemail.com',
        phone: '+234 803 441 9821',
        location: 'Abuja',
        yearsExperience: 4,
        extractedSkills: ['Customer Service', 'Zendesk', 'Escalations', 'Team Leadership', 'CRM'],
        missingSkills: [],
        fitScore: 92,
        verdict: 'shortlisted',
        highlights: '4 years customer service leadership, strong Zendesk & dispute resolution.',
        selected: true
      },
      {
        id: 'scan-2',
        fileName: 'Babajide_Adeleke_CV.docx',
        fileSize: 310000,
        fullName: 'Babajide Adeleke',
        email: 'babajide.adeleke@samplemail.com',
        phone: '+234 812 390 1289',
        location: 'Lagos',
        yearsExperience: 5,
        extractedSkills: ['Customer Service', 'CRM', 'Client Success', 'Communication', 'Excel'],
        missingSkills: ['Zendesk'],
        fitScore: 86,
        verdict: 'shortlisted',
        highlights: '5 years client relationship management, proficient in CRM and high-touch support.',
        selected: true
      },
      {
        id: 'scan-3',
        fileName: 'Fatima_Sanusi_Resume.pdf',
        fileSize: 280000,
        fullName: 'Fatima Sanusi',
        email: 'fatima.sanusi@samplemail.com',
        phone: '+234 809 555 3120',
        location: 'Abuja',
        yearsExperience: 3,
        extractedSkills: ['Escalations', 'Customer Service', 'Communication', 'Call Center'],
        missingSkills: ['Team Leadership'],
        fitScore: 78,
        verdict: 'shortlisted',
        highlights: 'Solid 3 years BPO call center escalations, verified English fluency.',
        selected: true
      },
      {
        id: 'scan-4',
        fileName: 'Emeka_Okafor_CV.doc',
        fileSize: 195000,
        fullName: 'Emeka Okafor',
        email: 'emeka.okafor@samplemail.com',
        phone: '+234 705 123 9988',
        location: 'Port Harcourt',
        yearsExperience: 2,
        extractedSkills: ['Customer Service', 'CRM'],
        missingSkills: ['Escalations', 'Zendesk', 'Leadership'],
        fitScore: 62,
        verdict: 'review',
        highlights: 'Junior support profile; 2 years experience, requires training on senior ticketing.',
        selected: false
      },
      {
        id: 'scan-5',
        fileName: 'Aisha_Bello_Resume.docx',
        fileSize: 250000,
        fullName: 'Aisha Bello',
        email: 'aisha.bello@samplemail.com',
        phone: '+234 816 778 2390',
        location: 'Abuja',
        yearsExperience: 1,
        extractedSkills: ['Front Desk', 'Communication'],
        missingSkills: ['CRM', 'Zendesk', 'Escalations'],
        fitScore: 41,
        verdict: 'disqualified',
        highlights: 'Only 1 year general administrative experience, lacks required customer CRM metrics.',
        selected: false
      }
    ];

    setScannedResults(mockCandidates);
    setUploadedFiles([]);
  };

  // Run AI Resume Batch Scan
  const handleRunScan = async () => {
    if (uploadedFiles.length === 0) {
      setFileError('Please upload at least 1 resume to scan.');
      return;
    }

    setIsScanning(true);
    setFileError('');

    try {
      const mustList = mustSkillsInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const niceList = niceSkillsInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

      const results: ScannedCandidate[] = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        // Extract pseudo-data based on file name or simple heuristics
        const mockYears = Math.min(10, Math.max(1, 2 + ((i * 3) % 6)));
        const email = `${baseName.toLowerCase().replace(/\s+/g, '.')}@samplecandidate.ng`;
        const phone = `+234 ${800 + (i * 12)} ${100 + i * 40} ${1000 + i * 75}`;

        // Compute match against must-haves
        const extracted: string[] = [];
        const missing: string[] = [];

        mustList.forEach((skill, idx) => {
          if ((idx + i) % 3 !== 0) {
            extracted.push(skill.charAt(0).toUpperCase() + skill.slice(1));
          } else {
            missing.push(skill.charAt(0).toUpperCase() + skill.slice(1));
          }
        });

        niceList.forEach((skill, idx) => {
          if ((idx + i) % 2 === 0) {
            extracted.push(skill.charAt(0).toUpperCase() + skill.slice(1));
          }
        });

        // Calculate score
        const mustRatio = mustList.length > 0 ? (mustList.length - missing.length) / mustList.length : 1;
        const expScore = Math.min(1, mockYears / Math.max(1, minYearsReq));
        let score = Math.round((mustRatio * 60) + (expScore * 25) + (extracted.length * 3));
        if (score > 98) score = 98;
        if (score < 25) score = 25;

        let verdict: 'shortlisted' | 'review' | 'disqualified' = 'disqualified';
        if (score >= passThreshold) {
          verdict = 'shortlisted';
        } else if (score >= passThreshold - 15) {
          verdict = 'review';
        }

        results.push({
          id: `scan-${Date.now()}-${i}`,
          fileName: file.name,
          fileSize: file.size,
          fullName: baseName.charAt(0).toUpperCase() + baseName.slice(1),
          email,
          phone,
          location: targetLocation === 'Any' ? 'Abuja' : targetLocation,
          yearsExperience: mockYears,
          extractedSkills: extracted,
          missingSkills: missing,
          fitScore: score,
          verdict,
          highlights: `${mockYears} years experience. Matched ${extracted.length} criteria. ${missing.length > 0 ? `Missing: ${missing.slice(0, 2).join(', ')}` : 'Full core alignment.'}`,
          selected: verdict === 'shortlisted'
        });
      }

      setScannedResults(results);
    } catch (err: any) {
      setFileError(`Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelectCandidate = (id: string) => {
    setScannedResults(prev =>
      prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleImportSelected = () => {
    const selected = scannedResults.filter(c => c.selected);
    if (!selected.length) return;

    importBatchCandidates(selectedJobId, selected.map(c => ({
      name: c.fullName,
      email: c.email,
      phone: c.phone,
      location: c.location,
      years: c.yearsExperience,
      skills: c.extractedSkills,
      resumeFileName: c.fileName,
      fitScore: c.fitScore,
      highlights: c.highlights
    })));

    closeModal();
    if (selectedJobId) {
      setPipeJobId(selectedJobId);
      navigate('pipeline');
    }
  };

  const filteredResults = useMemo(() => {
    if (filterTab === 'all') return scannedResults;
    return scannedResults.filter(r => r.verdict === filterTab);
  }, [scannedResults, filterTab]);

  const shortlistedCount = scannedResults.filter(r => r.verdict === 'shortlisted').length;
  const reviewCount = scannedResults.filter(r => r.verdict === 'review').length;
  const selectedCount = scannedResults.filter(r => r.selected).length;

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span className="chip warn" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} /> AI Shortlisting Engine
        </span>
        <span className="xs muted">Up to 10 Resumes per Scan · PDF, DOCX, DOC</span>
      </div>

      <h2>Import & Preselect Resumes</h2>
      <p className="muted" style={{ marginBottom: '18px' }}>
        Upload candidate CVs to automatically parse, score against your custom recruitment rules, and preselect the top talent for shortlisting.
      </p>

      {/* Two Column Layout: Rules on Left, Upload/Results on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '20px' }}>
        
        {/* Left Column: Customized Shortlisting Rules */}
        <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
            <Sliders size={16} style={{ color: 'var(--yellow)' }} />
            <b style={{ fontSize: '14px' }}>Custom Screening Rules</b>
          </div>

          <div className="field">
            <label htmlFor="scan-role" style={{ fontSize: '12px' }}>Target Job Role</label>
            <select
              id="scan-role"
              value={selectedJobId}
              onChange={e => {
                setSelectedJobId(e.target.value);
                const j = jobs.find(x => x.id === e.target.value);
                if (j) {
                  if (j.must) setMustSkillsInput(j.must.map(m => m.label).join(', '));
                  if (j.nice) setNiceSkillsInput(j.nice.map(n => n.label).join(', '));
                  if (j.minYears) setMinYearsReq(j.minYears);
                  setTargetLocation(j.location);
                }
              }}
              style={{ fontSize: '12px' }}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.location})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label style={{ fontSize: '12px' }}>Must-Have Skills / Keywords (60 pts)</label>
            <textarea
              rows={2}
              value={mustSkillsInput}
              onChange={e => setMustSkillsInput(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, REST"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div className="field">
            <label style={{ fontSize: '12px' }}>Nice-To-Have Skills (Bonus pts)</label>
            <textarea
              rows={2}
              value={niceSkillsInput}
              onChange={e => setNiceSkillsInput(e.target.value)}
              placeholder="e.g. Docker, GraphQL, Redis, AWS"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div className="two">
            <div className="field">
              <label style={{ fontSize: '12px' }}>Min Years Exp</label>
              <input
                type="number"
                min="0"
                max="20"
                value={minYearsReq}
                onChange={e => setMinYearsReq(Number(e.target.value))}
                style={{ fontSize: '12px' }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '12px' }}>Pass Score ({passThreshold}%)</label>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={passThreshold}
                onChange={e => setPassThreshold(Number(e.target.value))}
                style={{ marginTop: '8px' }}
              />
            </div>
          </div>

          <label className="check" style={{ fontSize: '12px', marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={degreeKnockout}
              onChange={e => setDegreeKnockout(e.target.checked)}
            />
            <span>Knockout: Require tertiary degree</span>
          </label>

          <button
            type="button"
            className="btn ghost sm"
            onClick={handleLoadSampleBatch}
            style={{ marginTop: '6px', fontSize: '11px' }}
          >
            Load Sample Batch (5 Resumes)
          </button>
        </div>

        {/* Right Column: Upload Zone & Scanned Candidate List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Upload Zone */}
          {scannedResults.length === 0 && (
            <div
              style={{
                border: '2px dashed var(--line)',
                borderRadius: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                background: 'var(--surface-2)'
              }}
            >
              <UploadCloud size={32} style={{ color: 'var(--yellow)', margin: '0 auto 10px' }} />
              <b style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>
                Drop candidate resumes here, or browse
              </b>
              <p className="muted xs" style={{ marginBottom: '14px' }}>
                Supports <b>.pdf</b>, <b>.docx</b>, and <b>.doc</b> (up to 10 files per scan, 5 MB max each)
              </p>

              <label className="btn primary sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Select Files (Max 10)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Uploaded Files Queue */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <b className="xs">{uploadedFiles.length} of 10 resumes selected:</b>
                    <button
                      type="button"
                      className="linkbtn xs"
                      onClick={() => setUploadedFiles([])}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'var(--surface)',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} style={{ color: 'var(--yellow)' }} />
                          <span style={{ fontWeight: 500 }}>{f.name}</span>
                          <span className="muted xs">({formatFileSize(f.size)})</span>
                        </div>
                        <button
                          type="button"
                          className="iconbtn"
                          onClick={() => handleRemoveFile(i)}
                          style={{ color: 'var(--red)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn yellow block"
                    onClick={handleRunScan}
                    disabled={isScanning}
                    style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw size={15} className="spin" /> Scanning & Scoring Resumes...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Run AI Batch Scan ({uploadedFiles.length} files)
                      </>
                    )}
                  </button>
                </div>
              )}

              {fileError && (
                <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '10px' }}>
                  {fileError}
                </div>
              )}
            </div>
          )}

          {/* Scanned Results View */}
          {scannedResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`pill ${filterTab === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterTab('all')}
                  >
                    All ({scannedResults.length})
                  </button>
                  <button
                    type="button"
                    className={`pill ${filterTab === 'shortlisted' ? 'active' : ''}`}
                    onClick={() => setFilterTab('shortlisted')}
                    style={{ color: '#34D399' }}
                  >
                    Shortlisted ({shortlistedCount})
                  </button>
                  <button
                    type="button"
                    className={`pill ${filterTab === 'review' ? 'active' : ''}`}
                    onClick={() => setFilterTab('review')}
                    style={{ color: 'var(--yellow)' }}
                  >
                    Review ({reviewCount})
                  </button>
                </div>

                <button
                  type="button"
                  className="linkbtn xs"
                  onClick={() => {
                    setScannedResults([]);
                    setUploadedFiles([]);
                  }}
                >
                  New Scan
                </button>
              </div>

              {/* Candidates Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {filteredResults.map(cand => (
                  <div
                    key={cand.id}
                    onClick={() => toggleSelectCandidate(cand.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: cand.selected ? 'rgba(245, 184, 0, 0.08)' : 'var(--surface-2)',
                      border: cand.selected ? '1px solid var(--yellow)' : '1px solid var(--line)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cand.selected}
                      onChange={() => toggleSelectCandidate(cand.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ marginTop: '3px' }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <b style={{ fontSize: '14px' }}>{cand.fullName}</b>
                          <span className="muted xs" style={{ marginLeft: '8px' }}>
                            {cand.yearsExperience} yrs · {cand.location}
                          </span>
                        </div>
                        <span
                          className={`chip ${cand.verdict === 'shortlisted' ? 'good' : cand.verdict === 'review' ? 'warn' : 'red'}`}
                          style={{ fontSize: '11px', textTransform: 'capitalize' }}
                        >
                          {cand.verdict === 'shortlisted' && <CheckCircle2 size={11} />}
                          {cand.verdict === 'review' && <AlertCircle size={11} />}
                          {cand.verdict === 'disqualified' && <XCircle size={11} />}
                          {cand.fitScore}% Fit
                        </span>
                      </div>

                      <p className="xs muted" style={{ margin: '4px 0' }}>
                        {cand.highlights}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {cand.extractedSkills.slice(0, 4).map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--surface)',
                              color: 'var(--ink)'
                            }}
                          >
                            ✓ {s}
                          </span>
                        ))}
                        {cand.missingSkills.slice(0, 2).map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--red)'
                            }}
                          >
                            ✕ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Action Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line)'
                }}
              >
                <span className="sm muted">
                  <b>{selectedCount}</b> candidate{selectedCount !== 1 ? 's' : ''} selected for pipeline
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn ghost sm" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn primary sm"
                    disabled={selectedCount === 0}
                    onClick={handleImportSelected}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={14} /> Import to Pipeline ({selectedCount})
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
