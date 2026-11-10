import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Client } from '../../types';
import {
  Building2,
  X,
  Mail,
  Phone,
  User,
  Percent,
  Calendar,
  Trash2,
  Check,
  AlertTriangle,
  Briefcase
} from 'lucide-react';

const COMMON_INDUSTRIES = [
  'Banking & FinTech',
  'IT & Software',
  'Healthcare & Pharma',
  'Logistics & Supply Chain',
  'E-Commerce & Retail',
  'Energy & Utilities',
  'Legal & Consulting',
  'Telecommunications'
];

const FEE_PRESETS = [10, 12.5, 15, 17.5, 20];
const GUARANTEE_PRESETS = [30, 60, 90, 180];

export const ClientModal: React.FC = () => {
  const { modal, closeModal, clients, createClient, updateClient, deleteClient, openModal, showToast } = useApp();
  const { hasPermission } = useAuth();

  const clientId = modal?.clientId;
  const isEditing = Boolean(clientId);
  const existingClient = clients.find(c => c.id === clientId);

  const [name, setName] = useState(existingClient?.name || '');
  const [industry, setIndustry] = useState(existingClient?.industry || 'IT & Software');
  const [contactName, setContactName] = useState(existingClient?.contact || '');
  const [contactEmail, setContactEmail] = useState(existingClient?.contactEmail || existingClient?.email || '');
  const [contactPhone, setContactPhone] = useState(existingClient?.contactPhone || existingClient?.phone || '');
  const [fee, setFee] = useState<number>(existingClient?.fee ?? 15);
  const [guarantee, setGuarantee] = useState<number>(existingClient?.guarantee ?? 90);
  const [notes, setNotes] = useState(existingClient?.notes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (existingClient) {
      setName(existingClient.name);
      setIndustry(existingClient.industry);
      setContactName(existingClient.contact);
      setContactEmail(existingClient.contactEmail || existingClient.email || '');
      setContactPhone(existingClient.contactPhone || existingClient.phone || '');
      setFee(existingClient.fee);
      setGuarantee(existingClient.guarantee);
      setNotes(existingClient.notes || '');
    }
  }, [existingClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Company name is required.');
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg('Hiring manager / contact person name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && clientId) {
        const res = await updateClient(clientId, {
          name: name.trim(),
          industry: industry.trim(),
          contact: contactName.trim(),
          contactEmail: contactEmail.trim(),
          email: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          phone: contactPhone.trim(),
          fee: Number(fee) || 15,
          guarantee: Number(guarantee) || 90,
          notes: notes.trim()
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to update client.');
          setIsSaving(false);
          return;
        }
      } else {
        const res = await createClient({
          name: name.trim(),
          industry: industry.trim(),
          contact: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          fee: Number(fee) || 15,
          guarantee: Number(guarantee) || 90
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create client.');
          setIsSaving(false);
          return;
        }
      }

      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clientId) return;
    setIsDeleting(true);
    try {
      const res = await deleteClient(clientId);
      if (res.success) {
        closeModal();
      } else {
        setErrorMsg(res.error || 'Failed to delete client.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete client.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canManageClients = hasPermission('manage_clients');

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
        background: 'var(--surface)',
        borderRadius: '14px',
        color: 'var(--ink)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--line)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(230, 57, 70, 0.12)',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>
              {isEditing ? `Edit Client: ${existingClient?.name}` : 'Add Corporate Client Employer'}
            </h2>
            <p className="xs muted" style={{ margin: '2px 0 0' }}>
              {isEditing
                ? 'Update billing fee percentage, guarantee terms, and HR contacts.'
                : 'Configure fee terms and guarantee periods for placement revenue.'}
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

      {/* Form Content */}
      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              background: 'rgba(230, 57, 70, 0.12)',
              border: '1px solid rgba(230, 57, 70, 0.3)',
              borderRadius: '8px',
              color: 'var(--red)',
              fontSize: '13px',
              marginBottom: '18px'
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Company Profile */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Employer Company Name <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Building2
              size={16}
              style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }}
            />
            <input
              type="text"
              required
              placeholder="e.g., Nexus Microfinance Bank or Flutterwave Africa"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Industry Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Industry / Sector
          </label>
          <input
            type="text"
            placeholder="e.g., Banking & FinTech"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontSize: '14px',
              marginBottom: '8px'
            }}
          />
          {/* Quick industry pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {COMMON_INDUSTRIES.map(ind => (
              <button
                type="button"
                key={ind}
                onClick={() => setIndustry(ind)}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: industry === ind ? 'var(--red)' : 'var(--line)',
                  background: industry === ind ? 'rgba(230, 57, 70, 0.12)' : 'transparent',
                  color: industry === ind ? 'var(--red)' : 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Contact Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Hiring Contact / HR Name <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }}
              />
              <input
                type="text"
                required
                placeholder="e.g. Chinelo Obi"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Contact Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }}
              />
              <input
                type="email"
                placeholder="e.g. hr@company.ng"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Contact Phone Number
          </label>
          <div style={{ position: 'relative' }}>
            <Phone
              size={16}
              style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }}
            />
            <input
              type="tel"
              placeholder="e.g. +234 803 111 2233"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Section 3: Commercial Terms (Fee & Guarantee) */}
        <div
          style={{
            padding: '16px',
            background: 'var(--bg)',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            marginBottom: '24px'
          }}
        >
          <h4 style={{ fontSize: '14px', margin: '0 0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Percent size={16} style={{ color: 'var(--yellow)' }} />
            Recruiter Placement Fee & Guarantee Terms
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Fee Percentage */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Placement Fee (% of 1st-year gross salary)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="40"
                  value={fee}
                  onChange={e => setFee(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '90px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                />
                <span className="muted xs">%</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {FEE_PRESETS.map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setFee(p)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: fee === p ? 'var(--yellow)' : 'var(--line)',
                      background: fee === p ? 'rgba(234, 179, 8, 0.14)' : 'transparent',
                      color: fee === p ? 'var(--yellow)' : 'var(--muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Guarantee Period */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Guarantee Period (days)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={guarantee}
                  onChange={e => setGuarantee(parseInt(e.target.value) || 0)}
                  style={{
                    width: '90px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                />
                <span className="muted xs">Days</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {GUARANTEE_PRESETS.map(g => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGuarantee(g)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: guarantee === g ? 'var(--green, #10B981)' : 'var(--line)',
                      background: guarantee === g ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                      color: guarantee === g ? 'var(--green, #10B981)' : 'var(--muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {g}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="xs muted" style={{ margin: '12px 0 0', lineHeight: 1.4 }}>
            💡 Placement fee is invoiced to the client upon candidate acceptance. If a placed candidate leaves during the guarantee period, Cube Tech Consults facilitates free replacement search.
          </p>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && (
          <div
            style={{
              padding: '14px',
              background: 'rgba(230, 57, 70, 0.12)',
              border: '1px solid rgba(230, 57, 70, 0.35)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>
              Are you sure you want to delete '{name}'?
            </p>
            <p className="xs muted" style={{ margin: '0 0 12px' }}>
              This will remove this corporate client record. Associated job orders and placements will be preserved and unlinked.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn sm"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ background: 'var(--red)', color: '#fff' }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Client'}
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dialog Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)'
          }}
        >
          <div>
            {isEditing && canManageClients && !showDeleteConfirm && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={15} />
                Delete Client
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn ghost" onClick={closeModal} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSaving ? (
                'Saving...'
              ) : isEditing ? (
                <>
                  <Check size={16} /> Save Changes
                </>
              ) : (
                <>
                  <Building2 size={16} /> Add Corporate Client
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
