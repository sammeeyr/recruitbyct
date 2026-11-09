import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { JobDetailModal } from '../public/JobDetailModal';
import { ApplyModal } from '../public/ApplyModal';
import { GoogleFormModal } from '../public/GoogleFormModal';
import { ApplicationSuccessModal } from '../public/ApplicationSuccessModal';
import { ApplicationDetailModal } from '../staff/ApplicationDetailModal';
import { CandidateModal } from '../staff/CandidateModal';
import { JobOrderModal } from '../staff/JobOrderModal';
import { NewJobOrderModal } from '../staff/NewJobOrderModal';
import { RejectMessageModal } from '../staff/RejectMessageModal';

export const ModalContainer: React.FC = () => {
  const { modal, closeModal } = useApp();

  useEffect(() => {
    if (modal) {
      document.body.classList.add('lock');
    } else {
      document.body.classList.remove('lock');
    }
    return () => {
      document.body.classList.remove('lock');
    };
  }, [modal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, closeModal]);

  if (!modal) return null;

  const isCentered = modal.type === 'reject' || modal.type === 'newjob';

  return (
    <div
      className={`overlay ${isCentered ? 'center' : ''}`}
      onClick={e => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label="Modal dialog"
        onClick={e => e.stopPropagation()}
      >
        {modal.type === 'job' && modal.mode === 'apply' && <ApplyModal />}
        {modal.type === 'job' && modal.mode === 'gform' && <GoogleFormModal />}
        {modal.type === 'job' && modal.mode === 'done' && <ApplicationSuccessModal />}
        {modal.type === 'job' && (!modal.mode || modal.mode === 'detail') && (
          <JobDetailModal />
        )}
        {modal.type === 'app' && <ApplicationDetailModal />}
        {modal.type === 'cand' && <CandidateModal />}
        {modal.type === 'jo' && <JobOrderModal />}
        {modal.type === 'newjob' && <NewJobOrderModal />}
        {modal.type === 'reject' && <RejectMessageModal />}
      </div>
    </div>
  );
};
