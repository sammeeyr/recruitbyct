import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { Logo } from '../common/Logo';
import { TriStripe } from '../common/TriStripe';
import { PublicFooter } from '../public/PublicFooter';
import { Shield, CheckCircle2, CreditCard, Building2, User, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const NIGERIAN_BANKS = [
  'Access Bank',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'Opay Digital Services'
];

const SPECIALIZATIONS = [
  'Customer Service & BPO',
  'Technology & Software Engineering',
  'Banking, Fintech & Finance',
  'Sales, FMCG & Business Development',
  'Supply Chain & Logistics',
  'Executive & Corporate Operations'
];

export const RecruiterOnboardingView: React.FC = () => {
  const { navigate, showToast } = useApp();
  const { setUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Abuja');
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [bankName, setBankName] = useState(NIGERIAN_BANKS[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please complete all required contact fields.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('You must agree to the ₦10,000 listing fee policy and partner terms.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiClient.neonFunctions.onboardRecruiter({
        fullName: fullName.trim(),
        agencyName: agencyName.trim() || 'Independent Recruiter',
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        location,
        specialization,
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim() || fullName.trim()
      });

      if (result.status === 'success' || result.recruiter) {
        // Set authenticated recruiter session
        const rec = result.recruiter || {};
        setUser({
          id: rec.id || `u_${Date.now()}`,
          name: fullName.trim(),
          email: email.trim(),
          role: 'recruiter',
          title: agencyName ? `Partner (${agencyName})` : 'Independent Recruiter',
          location,
          phone,
          token: result.sessionToken || `jwt_recruiter_${Date.now()}`
        });

        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 }
          });
        } catch {}

        showToast('Welcome to Cube Tech Consults! Your recruiter account is ready.');
        // Redirect directly to the dashboard to begin creating listings
        navigate('dashboard');
      } else {
        setErrorMsg(result.error || 'Failed to complete recruiter onboarding. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred during onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header className="hdr gut">
        <div className="inner">
          <a
            className="brand"
            href="/careers"
            onClick={e => {
              e.preventDefault();
              navigate('careers');
            }}
            aria-label="Cube Tech Consults home"
          >
            <Logo />
            <span className="wm">
              <b>CUBE TECH</b>
              <i>Consults</i>
            </span>
          </a>

          <nav aria-label="Main navigation">
            <button type="button" onClick={() => navigate('careers')}>
              Open roles
            </button>
            <button type="button" onClick={() => navigate('client-portal')}>
              Client portal
            </button>
          </nav>
        </div>
      </header>

      <TriStripe />

      {/* Main Content */}
      <main className="gut" style={{ flex: 1, paddingBlock: '36px' }}>
        <div className="inner" style={{ maxWidth: '820px', marginInline: 'auto' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span
              className="chip"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--red)',
                fontWeight: 600,
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px'
              }}
            >
              <Shield size={14} /> Official Recruiter Partner Network
            </span>
            <h1 className="caps" style={{ fontSize: '38px', lineHeight: 1.15, marginBottom: '12px' }}>
              Recruiter Self-Onboarding
            </h1>
            <p className="muted" style={{ fontSize: '16px', maxWidth: '620px', marginInline: 'auto' }}>
              Join the Cube Tech Consults recruitment network. Post verified client vacancies,
              source qualified talent, and receive commission payouts directly in Naira (₦).
            </p>
          </div>

          {/* Key Terms Banner */}
          <div
            className="card"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            <div>
              <div className="row" style={{ gap: '8px', alignItems: 'center', color: 'var(--red-text)', fontWeight: 700 }}>
                <CreditCard size={18} /> ₦10,000 / Listing
              </div>
              <p className="xs muted" style={{ marginTop: '4px' }}>
                Paid via Paystack to activate and publish roles to the public job board.
              </p>
            </div>
            <div>
              <div className="row" style={{ gap: '8px', alignItems: 'center', color: '#10B981', fontWeight: 700 }}>
                <CheckCircle2 size={18} /> Direct Bank Payouts
              </div>
              <p className="xs muted" style={{ marginTop: '4px' }}>
                Automated Naira transfers for candidate placements upon client payment.
              </p>
            </div>
            <div>
              <div className="row" style={{ gap: '8px', alignItems: 'center', color: 'var(--yellow-text)', fontWeight: 700 }}>
                <Shield size={18} /> Guarantee Protection
              </div>
              <p className="xs muted" style={{ marginTop: '4px' }}>
                Full automated audit tracking of 60/90-day replacement guarantee terms.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="card" style={{ padding: '28px' }}>
            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--red)',
                  color: 'var(--red)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <h2 className="caps" style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                1. Recruiter Agent & Agency Details
              </h2>

              <div className="two">
                <div className="field">
                  <label htmlFor="rec-name">
                    Full Name <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    id="rec-name"
                    type="text"
                    required
                    placeholder="e.g. Chidubem Okafor"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="rec-agency">Agency or Firm Name</label>
                  <input
                    id="rec-agency"
                    type="text"
                    placeholder="e.g. Apex Talent Advisory (or Independent)"
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="two">
                <div className="field">
                  <label htmlFor="rec-email">
                    Work Email Address <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    id="rec-email"
                    type="email"
                    required
                    placeholder="e.g. chidubem@apextalent.ng"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="rec-phone">
                    Phone Number (WhatsApp / Termii OTP) <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    id="rec-phone"
                    type="tel"
                    required
                    placeholder="e.g. +234 803 123 4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="two">
                <div className="field">
                  <label htmlFor="rec-loc">Primary Operating City / State</label>
                  <select
                    id="rec-loc"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  >
                    <option value="Abuja">Abuja (FCT)</option>
                    <option value="Lagos">Lagos State</option>
                    <option value="Port Harcourt">Port Harcourt (Rivers)</option>
                    <option value="Ibadan">Ibadan (Oyo)</option>
                    <option value="Kano">Kano State</option>
                    <option value="Remote Nigeria">Remote Nigeria</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="rec-spec">Sector Specialization</label>
                  <select
                    id="rec-spec"
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                  >
                    {SPECIALIZATIONS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <h2
                className="caps"
                style={{
                  fontSize: '20px',
                  margin: '28px 0 16px',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '8px'
                }}
              >
                2. Commission Payout Bank Account (Naira ₦)
              </h2>

              <div className="field">
                <label htmlFor="rec-bank">Nigerian Bank</label>
                <select
                  id="rec-bank"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                >
                  {NIGERIAN_BANKS.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="two">
                <div className="field">
                  <label htmlFor="rec-acc">10-Digit NUBAN Account Number</label>
                  <input
                    id="rec-acc"
                    type="text"
                    maxLength={10}
                    placeholder="e.g. 0123456789"
                    value={bankAccountNumber}
                    onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="field">
                  <label htmlFor="rec-acc-name">Account Name</label>
                  <input
                    id="rec-acc-name"
                    type="text"
                    placeholder="e.g. Chidubem Okafor"
                    value={bankAccountName}
                    onChange={e => setBankAccountName(e.target.value)}
                  />
                </div>
              </div>

              <h2
                className="caps"
                style={{
                  fontSize: '20px',
                  margin: '28px 0 16px',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '8px'
                }}
              >
                3. Partner Listing Terms & ₦10,000 Fee Policy
              </h2>

              <div
                style={{
                  background: 'var(--surface-2)',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}
              >
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li>
                    <b>₦10,000 Listing Fee:</b> Recruiter partners pay a one-time non-refundable
                    fee of ₦10,000 via Paystack for each draft vacancy to be published to the public board.
                  </li>
                  <li>
                    <b>Candidate Integrity:</b> Blind hiring protocols apply. Contact details are masked
                    to corporate clients until formal interview requests are requested.
                  </li>
                  <li>
                    <b>Replacement Guarantee:</b> Candidate placements are subject to 60 or 90 days replacement
                    guarantees as agreed with the client.
                  </li>
                </ul>
              </div>

              <div className="field">
                <label className="check" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <span style={{ fontSize: '13px' }}>
                    I accept the Cube Tech Consults Recruiter Partner Terms and understand that each listing requires
                    a ₦10,000 fee via Paystack prior to publication.
                  </span>
                </label>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  className="btn primary block"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '15px',
                    padding: '14px'
                  }}
                >
                  {submitting ? 'Registering Agent...' : 'Complete Onboarding & Enter Dashboard'}
                  {!submitting && <ArrowRight size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
