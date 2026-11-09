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
import { EditJobOrderModal } from '../staff/EditJobOrderModal';
import { ResumeBatchScreeningModal } from '../staff/ResumeBatchScreeningModal';
import { LinkedInJobsModal } from '../staff/LinkedInJobsModal';
import { RejectMessageModal } from '../staff/RejectMessageModal';
import { PaystackListingModal } from '../staff/PaystackListingModal';
import { AiInterviewInviteModal } from '../staff/AiInterviewInviteModal';
import { AiInterviewResultModal } from '../staff/AiInterviewResultModal';

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

  const isCentered =
    modal.type === 'reject' ||
    modal.type === 'newjob' ||
    modal.type === 'aidraft' ||
    modal.type === 'editjob' ||
    modal.type === 'resume-import' ||
    modal.type === 'linkedin-jobs' ||
    modal.type === 'paystack' ||
    modal.type === 'ai-interview-invite' ||
    modal.type === 'ai-interview-result';

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
        style={
          modal.type === 'resume-import' ||
          modal.type === 'linkedin-jobs' ||
          modal.type === 'editjob' ||
          modal.type === 'ai-interview-invite' ||
          modal.type === 'ai-interview-result'
            ? { maxWidth: '880px', width: '92%' }
            : undefined
        }
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
        {(modal.type === 'newjob' || modal.type === 'aidraft') && <NewJobOrderModal />}
        {modal.type === 'editjob' && <EditJobOrderModal />}
        {modal.type === 'resume-import' && <ResumeBatchScreeningModal />}
        {modal.type === 'linkedin-jobs' && <LinkedInJobsModal />}
        {modal.type === 'paystack' && <PaystackListingModal />}
        {modal.type === 'ai-interview-invite' && <AiInterviewInviteModal />}
        {modal.type === 'ai-interview-result' && <AiInterviewResultModal />}
        {modal.type === 'reject' && <RejectMessageModal />}
      </div>
    </div>
  );
};
