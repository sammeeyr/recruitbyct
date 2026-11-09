import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KNOCKOUT_QUESTIONS, LOCATIONS } from '../../data/mockData';
import { formatFileSize, prettyKey, validateCvFile } from '../../utils/helpers';
import { X, UploadCloud, CheckCircle } from 'lucide-react';

export const ApplyModal: React.FC = () => {
  const { modal, closeModal, openModal, jobs, clients, submitApplication } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Abuja');
  const [years, setYears] = useState(3);
  const [skills, setSkills] = useState('');
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
      fileName: selectedCvFile ? selectedCvFile.name : 'Sample_CV.pdf'
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
