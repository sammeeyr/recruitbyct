import React from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Toast } from './components/common/Toast';
import { ModalContainer } from './components/common/ModalContainer';

// Public views
import { CareersView } from './components/public/CareersView';
import { TrackView } from './components/public/TrackView';
import { RecruiterOnboardingView } from './components/recruiter/RecruiterOnboardingView';
import { RecruiterLoginView } from './components/recruiter/RecruiterLoginView';
import { AiInterviewRoomView } from './components/public/AiInterviewRoomView';

// Staff views
import { DashboardView } from './components/staff/DashboardView';
import { PipelineView } from './components/staff/PipelineView';
import { TalentPoolView } from './components/staff/TalentPoolView';
import { JobOrdersView } from './components/staff/JobOrdersView';
import { ClientsView } from './components/staff/ClientsView';
import { PlacementsView } from './components/staff/PlacementsView';
import { IntakeView } from './components/staff/IntakeView';
import { DriveSyncView } from './components/staff/DriveSyncView';
import { AdminControlPanelView } from './components/admin/AdminControlPanelView';

// Client view
import { ClientPortalView } from './components/client/ClientPortalView';

export const AppContent: React.FC = () => {
  const { view } = useApp();
  const { canAccessAts } = useAuth();

  const renderActiveView = () => {
    switch (view) {
      case 'careers':
        return <CareersView />;
      case 'track':
        return <TrackView />;
      case 'onboard':
        return <RecruiterOnboardingView />;
      case 'login':
        return <RecruiterLoginView />;
      case 'interview':
        return <AiInterviewRoomView />;
      case 'dashboard':
        return canAccessAts ? <DashboardView /> : <RecruiterLoginView />;
      case 'pipeline':
        return canAccessAts ? <PipelineView /> : <RecruiterLoginView />;
      case 'pool':
        return canAccessAts ? <TalentPoolView /> : <RecruiterLoginView />;
      case 'job-orders':
        return canAccessAts ? <JobOrdersView /> : <RecruiterLoginView />;
      case 'clients':
        return canAccessAts ? <ClientsView /> : <RecruiterLoginView />;
      case 'placements':
        return canAccessAts ? <PlacementsView /> : <RecruiterLoginView />;
      case 'intake':
        return canAccessAts ? <IntakeView /> : <RecruiterLoginView />;
      case 'drive-sync':
        return canAccessAts ? <DriveSyncView /> : <RecruiterLoginView />;
      case 'admin':
        return canAccessAts ? <AdminControlPanelView /> : <RecruiterLoginView />;
      case 'client-portal':
        return <ClientPortalView />;
      default:
        return <CareersView />;
    }
  };

  return (
    <>
      <div id="app">{renderActiveView()}</div>
      <ModalContainer />
      <Toast />
    </>
  );
};
