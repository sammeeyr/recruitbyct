import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { KNOCKOUT_QUESTIONS, LOCATIONS } from '../../data/mockData';
import { formatFileSize, prettyKey, validateCvFile } from '../../utils/helpers';
import { X, UploadCloud, CheckCircle, Sparkles, Check, ExternalLink } from 'lucide-react';
import { LinkedinIcon } from '../common/LinkedinIcon';

export const ApplyModal: React.FC = () => {
  const { modal, closeModal, openModal, jobs, clients, submitApplication } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Abuja');
  const [years, setYears] = useState(3);
  const [skills, setSkills] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(false);
  const [customLinkedInInput, setCustomLinkedInInput] = useState('');
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [isSampleCv, setIsSampleCv] = useState(false);
  const [cvError, setCvError] = useState('');
  const [formError, setFormError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({
    ko1: 'yes',
    ko2: 'yes',
    ko3: 'yes'
  });
  const [consent, setConsent] = useState(false);

  if (!modal || modal.type !== 'job' || modal.mode !== 'apply') {
    return null;
  }

  const job = jobs.find(j => j.id === modal.id);
  if (!job) return null;

  const client = clients.find(c => c.id === job.clientId);
  const relevantSkills = [...job.must, ...job.nice]
    .map(x => x.keys[0])
    .filter(Boolean)
    .slice(0, 6);

  useEffect(() => {
    if (modal?.data?.prefillLinkedIn && !isLinkedInConnected) {
      handleLinkedInPrefill('https://www.linkedin.com/in/applicant-profile');
    }
  }, [modal?.data]);

  const handleLinkedInPrefill = (urlOverride?: string) => {
    const defaultProfileUrl = urlOverride || customLinkedInInput.trim() || 'https://www.linkedin.com/in/applicant-profile';
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
    setYears(Math.max(job.minYears, 3));

    const autoSkills = relevantSkills.map(prettyKey).slice(0, 4).join(', ');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCvFile && !isSampleCv) {
      setFormError('Attach your CV as a PDF or DOCX, or choose "Use a sample CV".');
      return;
    }

    if (!consent) {
      setFormError('Please give consent to process your application.');
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
      fileName: selectedCvFile ? selectedCvFile.name : (isLinkedInConnected ? `${fullName.replace(/\s+/g, '_')}_LinkedIn_Summary.pdf` : 'Sample_CV.pdf'),
      source: isLinkedInConnected ? 'LinkedIn' : 'Careers site',
      linkedinUrl: linkedinUrl.trim() || undefined
    });
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

      <h2>Apply: {job.title}</h2>
      <p className="muted" style={{ marginBottom: '18px' }}>
        {job.listing.confidential ? 'Confidential client' : client?.name} · {job.location}
      </p>

      <div className="banner" style={{ marginBottom: '16px' }}>
        <b>Trouble uploading?</b>{' '}
        <button
          type="button"
          className="linkbtn"
          onClick={() => openModal({ type: 'job', id: job.id, mode: 'gform' })}
        >
          Apply with our Google Form instead
        </button>
      </div>

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
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#0A66C2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <LinkedinIcon size={16} />
          </div>
          <div>
            <b style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isLinkedInConnected ? (
                <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={13} strokeWidth={3} /> Connected to LinkedIn Profile
                </span>
              ) : (
                'Apply Faster with LinkedIn'
              )}
            </b>
            <p className="xs muted" style={{ margin: 0 }}>
              {isLinkedInConnected
                ? `Details, experience, and skills prefilled (${linkedinUrl})`
                : 'Auto-fill your contact details, experience, and skills in 1 click.'}
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
            Reset
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

      <form onSubmit={handleSubmit}>
        <div className="two">
          <div className="field">
            <label htmlFor="ap-name">Full name</label>
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
            <label htmlFor="ap-email">Email</label>
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
            <label htmlFor="ap-phone">Phone or WhatsApp</label>
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
            <label htmlFor="ap-loc">Where are you based?</label>
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
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="ap-linkedin">
            LinkedIn Profile URL <span className="xs muted">(Optional)</span>
          </label>
          <input
            id="ap-linkedin"
            type="url"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/your-profile"
            autoComplete="url"
          />
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="ap-years">Years of experience</label>
            <input
              id="ap-years"
              type="number"
              min="0"
              max="45"
              required
              value={years}
              onChange={e => setYears(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div className="field">
            <label htmlFor="ap-cv">CV (PDF or DOCX, up to 5 MB)</label>
            <div className={`dz ${cvError ? 'bad' : selectedCvFile || isSampleCv ? 'ok' : ''}`}>
              <input
                id="ap-cv"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              <div className="hint">
                <span>
                  {isSampleCv ? (
                    <span style={{ color: 'var(--good)' }}>Sample_CV.pdf (sample attached)</span>
                  ) : selectedCvFile ? (
                    `${selectedCvFile.name} (${formatFileSize(selectedCvFile.size)})`
                  ) : (
                    'No file chosen.'
                  )}
                </span>{' '}
                <button type="button" className="linkbtn" onClick={useSampleCv}>
                  Use a sample CV
                </button>
              </div>
            </div>
            {cvError && (
              <div className="err" role="alert">
                {cvError}
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label htmlFor="ap-skills">Your skills, separated by commas</label>
          <input
            id="ap-skills"
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder={`e.g. ${relevantSkills.slice(0, 3).map(prettyKey).join(', ')}`}
            autoComplete="off"
          />
          <div className="skills" role="group" aria-label="Skills this role asks for">
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
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="hint">Tap the skills you have. Only add what is true on your CV.</p>
        </div>

        <fieldset>
          <legend>Quick questions</legend>
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

        <label className="check">
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

        {formError && (
          <div className="err" role="alert">
            {formError}
          </div>
        )}

        <button
          className="btn primary block"
          type="submit"
          style={{ marginTop: '16px' }}
        >
          Submit application
        </button>
      </form>
    </>
  );
};
