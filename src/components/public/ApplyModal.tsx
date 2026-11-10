import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { KNOCKOUT_QUESTIONS, LOCATIONS } from '../../data/mockData';
import { formatFileSize, formatNaira, prettyKey, validateCvFile } from '../../utils/helpers';
import {
  X,
  UploadCloud,
  CheckCircle,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { LinkedinIcon } from '../common/LinkedinIcon';

export const ApplyModal: React.FC = () => {
  const { modal, closeModal, openModal, jobs, clients, submitApplication } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Contact
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Abuja');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(false);
  const [customLinkedInInput, setCustomLinkedInInput] = useState('');

  // Step 2: Experience & Compensation
  const [headline, setHeadline] = useState('');
  const [years, setYears] = useState(3);
  const [expectedSalary, setExpectedSalary] = useState<number>(0);
  const [availabilityDays, setAvailabilityDays] = useState<number>(14);
  const [workPreference, setWorkPreference] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');

  // Step 3: Resume & Skills
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [isSampleCv, setIsSampleCv] = useState(false);
  const [cvError, setCvError] = useState('');
  const [skills, setSkills] = useState('');

  // Step 4: Questions & Consent
  const [answers, setAnswers] = useState<Record<string, string>>({
    ko1: 'yes',
    ko2: 'yes',
    ko3: 'yes'
  });
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState('');

  if (!modal || modal.type !== 'job' || modal.mode !== 'apply') {
    return null;
  }

  const job = jobs.find(j => j.id === modal.id);
  if (!job) return null;

  const client = clients.find(c => c.id === job.clientId);
  const relevantSkills = [...job.must, ...job.nice]
    .map(x => x.keys[0])
    .filter(Boolean)
    .slice(0, 8);

  // Default salary from job order mid-point
  useEffect(() => {
    if (job && !expectedSalary) {
      setExpectedSalary(Math.round((job.salary[0] + job.salary[1]) / 2));
    }
  }, [job]);

  useEffect(() => {
    if (modal?.data?.prefillLinkedIn && !isLinkedInConnected) {
      handleLinkedInPrefill('https://www.linkedin.com/in/applicant-profile');
    }
  }, [modal?.data]);

  const handleLinkedInPrefill = (urlOverride?: string) => {
    const defaultProfileUrl = urlOverride || customLinkedInInput.trim() || 'https://www.linkedin.com/in/chidera-nwosu-pro';
    setLinkedinUrl(defaultProfileUrl);
    setIsLinkedInConnected(true);
    setIsSampleCv(true);
    setSelectedCvFile(null);
    setCvError('');
    setShowLinkedInPrompt(false);

    if (!fullName) setFullName('Chidera Nwosu');
    if (!email) setEmail('chidera.nwosu@example.com');
    if (!phone) setPhone('0802 345 6789');
    if (!location) setLocation(job.location.includes('Lagos') ? 'Lagos' : 'Abuja');
    if (!headline) setHeadline(job.title);
    setYears(Math.max(job.minYears, 4));
    if (!expectedSalary) setExpectedSalary(Math.round((job.salary[0] + job.salary[1]) / 2));

    const autoSkills = relevantSkills.map(prettyKey).slice(0, 5).join(', ');
    if (!skills) setSkills(autoSkills);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSampleCv(false);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedCvFile(null);
      setCvError('');
      return;
    }

    const validationMsg = validateCvFile(file.name, file.size, file.type);
    if (validationMsg) {
      e.target.value = '';
      setSelectedCvFile(null);
      setCvError(validationMsg);
      return;
    }

    setCvError('');
    setSelectedCvFile(file);
  };

  const useSampleCv = () => {
    setIsSampleCv(true);
    setSelectedCvFile(null);
    setCvError('');
  };

  const toggleSkill = (skillName: string) => {
    const list = skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const exists = list.some(s => s.toLowerCase() === skillName.toLowerCase());
    let nextList: string[];
    if (exists) {
      nextList = list.filter(s => s.toLowerCase() !== skillName.toLowerCase());
    } else {
      nextList = [...list, skillName];
    }
    setSkills(nextList.join(', '));
  };

  // Step Nav & Validation
  const validateStep = (s: number): boolean => {
    setFormError('');
    if (s === 1) {
      if (!fullName.trim()) {
        setFormError('Please enter your full name.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setFormError('Please enter a valid email address.');
        return false;
      }
      if (!phone.trim()) {
        setFormError('Please provide a contact phone or WhatsApp number.');
        return false;
      }
      return true;
    }

    if (s === 2) {
      if (years < 0) {
        setFormError('Years of experience cannot be negative.');
        return false;
      }
      if (expectedSalary <= 0) {
        setFormError('Please state your expected monthly compensation.');
        return false;
      }
      return true;
    }

    if (s === 3) {
      if (!selectedCvFile && !isSampleCv) {
        setFormError('Attach your CV as a PDF or DOCX, or click "Use a sample CV".');
        return false;
      }
      return true;
    }

    return true;
  };

  const goToNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(4, prev + 1) as any);
    }
  };

  const goToPrevStep = () => {
    setFormError('');
    setStep(prev => Math.max(1, prev - 1) as any);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCvFile && !isSampleCv) {
      setFormError('Attach your CV as a PDF or DOCX, or choose "Use a sample CV".');
      return;
    }

    if (!consent) {
      setFormError('Please give consent to process your application and share with the hiring client.');
      return;
    }

    const skillList = skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    submitApplication({
      jobId: job.id,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      loc: location,
      years: Number(years),
      skills: skillList,
      answers,
      fileName: selectedCvFile
        ? selectedCvFile.name
        : isLinkedInConnected
        ? `${fullName.replace(/\s+/g, '_')}_LinkedIn_Summary.pdf`
        : 'Sample_CV.pdf',
      source: isLinkedInConnected ? 'LinkedIn' : 'Careers site',
      linkedinUrl: linkedinUrl.trim() || undefined,
      headline: headline.trim() || undefined,
      expectedSalary: Number(expectedSalary) || undefined,
      availabilityDays
    });
  };

  const stepTitles = [
    { num: 1, title: 'Contact', icon: User },
    { num: 2, title: 'Experience', icon: Briefcase },
    { num: 3, title: 'Resume & Skills', icon: FileText },
    { num: 4, title: 'Review & Submit', icon: ShieldCheck }
  ];

  const matchedSkillsCount = relevantSkills.filter(k =>
    skills.toLowerCase().includes(prettyKey(k).toLowerCase())
  ).length;

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

      {/* Header */}
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
            background: 'rgba(10, 102, 194, 0.1)',
            color: '#0A66C2',
            border: '1px solid rgba(10, 102, 194, 0.25)'
          }}
        >
          <LinkedinIcon size={12} /> Easy Apply
        </span>
        <span className="xs muted">· {job.location}</span>
      </div>

      <h2 style={{ fontSize: '20px', margin: '2px 0 4px' }}>{job.title}</h2>
      <p className="muted xs" style={{ marginBottom: '14px' }}>
        {job.listing.confidential ? 'Confidential client' : client?.name} · Budget: {formatNaira(job.salary[0])} - {formatNaira(job.salary[1])}/mo
      </p>

      {/* Step Progress Stepper */}
      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="xs muted" style={{ fontWeight: 600 }}>
            Step {step} of 4: <b style={{ color: 'var(--ink)' }}>{stepTitles[step - 1].title}</b>
          </span>
          <span className="xs muted font-mono">{step * 25}% complete</span>
        </div>
        <div className="progress" style={{ height: '6px', margin: 0 }}>
          <u style={{ width: `${step * 25}%`, background: '#0A66C2', transition: 'width 0.25s ease' }} />
        </div>

        {/* Step Breadcrumbs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px dashed var(--line)'
          }}
        >
          {stepTitles.map(st => {
            const Icon = st.icon;
            const isCompleted = step > st.num;
            const isCurrent = step === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  if (st.num < step || validateStep(step)) {
                    setStep(st.num as any);
                  }
                }}
                disabled={st.num > step && !validateStep(step)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: st.num <= step ? 'pointer' : 'not-allowed',
                  opacity: isCurrent ? 1 : isCompleted ? 0.85 : 0.45,
                  textAlign: 'left'
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted ? 'var(--good)' : isCurrent ? '#0A66C2' : 'var(--line)',
                    color: isCompleted || isCurrent ? '#fff' : 'var(--muted)',
                    flexShrink: 0
                  }}
                >
                  {isCompleted ? <Check size={11} strokeWidth={3} /> : st.num}
                </div>
                <span
                  className="xs"
                  style={{
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--ink)' : 'var(--muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {st.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alternative Form Hint */}
      <div className="banner" style={{ marginBottom: '14px', padding: '8px 12px', fontSize: '12px' }}>
        <b>Prefer standard form?</b>{' '}
        <button
          type="button"
          className="linkbtn"
          onClick={() => openModal({ type: 'job', id: job.id, mode: 'gform' })}
        >
          Apply with Google Form
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ================= STEP 1: CONTACT INFORMATION ================= */}
        {step === 1 && (
          <div>
            {/* LinkedIn 1-Click Prefill Banner */}
            <div
              style={{
                background: isLinkedInConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(10, 102, 194, 0.08)',
                border: `1px solid ${isLinkedInConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(10, 102, 194, 0.25)'}`,
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#0A66C2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  <LinkedinIcon size={18} />
                </div>
                <div>
                  <b style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isLinkedInConnected ? (
                      <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} strokeWidth={3} /> LinkedIn Profile Connected
                      </span>
                    ) : (
                      'Easy Apply with LinkedIn'
                    )}
                  </b>
                  <p className="xs muted" style={{ margin: 0 }}>
                    {isLinkedInConnected
                      ? `Details, headline, and skills prefilled (${linkedinUrl})`
                      : 'Auto-fill your contact details, headline, and skills in 1 click.'}
                  </p>
                </div>
              </div>

              {!isLinkedInConnected ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => handleLinkedInPrefill()}
                    style={{
                      background: '#0A66C2',
                      color: '#fff',
                      borderColor: '#0A66C2',
                      fontSize: '12px',
                      padding: '5px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sparkles size={12} /> 1-Click Prefill
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => setShowLinkedInPrompt(!showLinkedInPrompt)}
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Enter Profile URL
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="linkbtn xs"
                  onClick={() => {
                    setIsLinkedInConnected(false);
                    setLinkedinUrl('');
                  }}
                  style={{ color: 'var(--red-text)' }}
                >
                  Disconnect
                </button>
              )}
            </div>

            {showLinkedInPrompt && !isLinkedInConnected && (
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}
              >
                <label htmlFor="li-url-input" className="xs" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Enter your public LinkedIn Profile URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="li-url-input"
                    type="url"
                    placeholder="https://www.linkedin.com/in/your-profile"
                    value={customLinkedInInput}
                    onChange={e => setCustomLinkedInInput(e.target.value)}
                    style={{ flex: 1, fontSize: '12px' }}
                  />
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => handleLinkedInPrefill()}
                    style={{ background: '#0A66C2', borderColor: '#0A66C2' }}
                  >
                    Sync Profile
                  </button>
                </div>
              </div>
            )}

            <div className="two">
              <div className="field">
                <label htmlFor="ap-name">Full name *</label>
                <input
                  id="ap-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Chinelo Okonkwo"
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="ap-email">Email address *</label>
                <input
                  id="ap-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="chinelo@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="ap-phone">Phone or WhatsApp *</label>
                <input
                  id="ap-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0803 123 4567"
                  autoComplete="tel"
                />
              </div>
              <div className="field">
                <label htmlFor="ap-loc">Current location *</label>
                <select
                  id="ap-loc"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="Remote / Global">Remote / Global</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="ap-linkedin">
                LinkedIn Profile URL <span className="xs muted">(Recommended for Easy Apply)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="ap-linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={e => {
                    setLinkedinUrl(e.target.value);
                    if (e.target.value.includes('linkedin.com')) {
                      setIsLinkedInConnected(true);
                    }
                  }}
                  placeholder="https://www.linkedin.com/in/your-profile"
                  autoComplete="url"
                />
              </div>
              <p className="hint">Recruiters and hiring managers review LinkedIn profiles to fast-track interview decisions.</p>
            </div>
          </div>
        )}

        {/* ================= STEP 2: EXPERIENCE & PREFERENCES ================= */}
        {step === 2 && (
          <div>
            <div className="field">
              <label htmlFor="ap-headline">Current / Target Professional Headline</label>
              <input
                id="ap-headline"
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder={`e.g. ${job.title} | Specialist`}
                autoComplete="organization-title"
              />
              <p className="hint">Summarize your current domain or core technical title.</p>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="ap-years">Years of relevant experience</label>
                <input
                  id="ap-years"
                  type="number"
                  min="0"
                  max="45"
                  required
                  value={years}
                  onChange={e => setYears(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="hint">This role asks for at least {job.minYears} years.</p>
              </div>

              <div className="field">
                <label htmlFor="ap-sal">Expected monthly salary (₦ NGN)</label>
                <input
                  id="ap-sal"
                  type="number"
                  step="50000"
                  min="50000"
                  required
                  value={expectedSalary}
                  onChange={e => setExpectedSalary(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="hint">
                  {job.salary ? `Listing range: ${formatNaira(job.salary[0])} - ${formatNaira(job.salary[1])}` : 'Gross monthly'}
                </p>
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="ap-avail">Availability / Notice Period</label>
                <select
                  id="ap-avail"
                  value={availabilityDays}
                  onChange={e => setAvailabilityDays(Number(e.target.value))}
                >
                  <option value={0}>Immediately available (0 days)</option>
                  <option value={14}>2 weeks notice</option>
                  <option value={30}>1 month notice</option>
                  <option value={60}>2 months or more</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="ap-pref">Work arrangement preference</label>
                <select
                  id="ap-pref"
                  value={workPreference}
                  onChange={e => setWorkPreference(e.target.value as any)}
                >
                  <option value="Hybrid">Hybrid (In-office + Remote)</option>
                  <option value="Remote">Remote only</option>
                  <option value="On-site">On-site at client office</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: RESUME & SKILLS ================= */}
        {step === 3 && (
          <div>
            <div className="field">
              <label htmlFor="ap-cv">Resume / CV (PDF or DOCX, up to 5 MB) *</label>
              <div className={`dz ${cvError ? 'bad' : selectedCvFile || isSampleCv ? 'ok' : ''}`}>
                <input
                  id="ap-cv"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                />
                <div className="hint" style={{ padding: '8px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <UploadCloud size={20} className="muted" />
                    <span style={{ fontWeight: 600 }}>
                      {isSampleCv ? (
                        <span style={{ color: 'var(--good)' }}>
                          ✓ {isLinkedInConnected ? `${fullName.replace(/\s+/g, '_')}_LinkedIn_Summary.pdf (Auto-generated)` : 'Sample_CV.pdf (Ready)'}
                        </span>
                      ) : selectedCvFile ? (
                        <span style={{ color: 'var(--good)' }}>✓ {selectedCvFile.name} ({formatFileSize(selectedCvFile.size)})</span>
                      ) : (
                        'Drop your resume here, or browse files'
                      )}
                    </span>
                  </div>
                  <div>
                    <button type="button" className="linkbtn xs" onClick={useSampleCv}>
                      Use a test sample CV
                    </button>
                    {isLinkedInConnected && (
                      <span className="xs muted" style={{ marginLeft: '8px' }}>
                        · Or keep auto-generated LinkedIn summary
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {cvError && (
                <div className="err" role="alert">
                  {cvError}
                </div>
              )}
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="ap-skills" style={{ margin: 0 }}>
                  Relevant Skills & Expertise
                </label>
                <span className="xs" style={{ color: matchedSkillsCount >= 2 ? 'var(--good)' : 'var(--muted)' }}>
                  {matchedSkillsCount} of {relevantSkills.length} job skills matched
                </span>
              </div>
              <input
                id="ap-skills"
                type="text"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder={`e.g. ${relevantSkills.slice(0, 4).map(prettyKey).join(', ')}`}
                autoComplete="off"
              />
              <div className="skills" role="group" aria-label="Skills this role asks for" style={{ marginTop: '8px' }}>
                {relevantSkills.map(k => {
                  const label = prettyKey(k);
                  const isActive = skills
                    .split(',')
                    .map(s => s.trim().toLowerCase())
                    .includes(label.toLowerCase());
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => toggleSkill(label)}
                      style={{
                        background: isActive ? '#0A66C2' : undefined,
                        color: isActive ? '#fff' : undefined,
                        borderColor: isActive ? '#0A66C2' : undefined
                      }}
                    >
                      {isActive && <Check size={11} style={{ marginRight: '3px' }} />}
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="hint">Tap to add skills that match your experience. AI screening evaluates these against role requirements.</p>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SCREENING & FINAL REVIEW ================= */}
        {step === 4 && (
          <div>
            <fieldset style={{ marginBottom: '16px' }}>
              <legend>Screening Questions</legend>
              {KNOCKOUT_QUESTIONS.map(k => (
                <div key={k.id} style={{ marginBottom: '10px' }}>
                  <p className="sm" style={{ marginBottom: '6px' }}>
                    {k.q}
                  </p>
                  <div className="radios">
                    <label>
                      <input
                        type="radio"
                        name={k.id}
                        value="yes"
                        checked={answers[k.id] === 'yes'}
                        onChange={() => setAnswers(prev => ({ ...prev, [k.id]: 'yes' }))}
                      />{' '}
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={k.id}
                        value="no"
                        checked={answers[k.id] === 'no'}
                        onChange={() => setAnswers(prev => ({ ...prev, [k.id]: 'no' }))}
                      />{' '}
                      No
                    </label>
                  </div>
                </div>
              ))}
            </fieldset>

            {/* Application Summary Card */}
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b className="xs uppercase muted" style={{ letterSpacing: '0.04em' }}>
                  Summary of your application
                </b>
                <button type="button" className="linkbtn xs" onClick={() => setStep(1)}>
                  Edit
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span className="muted">Applicant:</span> <b>{fullName}</b>
                </div>
                <div>
                  <span className="muted">Contact:</span> <span>{email} · {phone}</span>
                </div>
                <div>
                  <span className="muted">Location:</span> <span>{location}</span>
                </div>
                <div>
                  <span className="muted">Experience:</span> <span>{years} yrs · {headline || 'Applicant'}</span>
                </div>
                <div>
                  <span className="muted">Expected:</span> <span>{formatNaira(expectedSalary)}/mo</span>
                </div>
                <div>
                  <span className="muted">CV File:</span>{' '}
                  <span style={{ color: 'var(--good)', fontWeight: 600 }}>
                    {selectedCvFile ? selectedCvFile.name : isLinkedInConnected ? 'LinkedIn Summary.pdf' : 'Sample_CV.pdf'}
                  </span>
                </div>
              </div>

              {linkedinUrl && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--line)', fontSize: '12px' }}>
                  <span className="muted">LinkedIn Profile:</span>{' '}
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0A66C2' }}>
                    {linkedinUrl}
                  </a>
                </div>
              )}
            </div>

            <label className="check" style={{ marginBottom: '14px' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                required
              />
              <span>
                I agree that Cube Tech Consults stores and processes my CV and details to match
                me with roles, and may share my profile with employers I am submitted to.
              </span>
            </label>
          </div>
        )}

        {/* Error message */}
        {formError && (
          <div className="err" role="alert" style={{ marginBottom: '14px' }}>
            <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            {formError}
          </div>
        )}

        {/* Footer Actions / Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          {step > 1 ? (
            <button
              type="button"
              className="btn ghost sm"
              onClick={goToPrevStep}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <button
              type="button"
              className="btn ghost sm"
              onClick={closeModal}
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              className="btn primary"
              onClick={goToNextStep}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0A66C2',
                borderColor: '#0A66C2'
              }}
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              className="btn primary"
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0A66C2',
                borderColor: '#0A66C2',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <LinkedinIcon size={16} /> Submit Easy Apply
            </button>
          )}
        </div>
      </form>
    </>
  );
};
