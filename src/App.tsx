import React from 'react';
import { useApp } from './context/AppContext';
import { TopStrip } from './components/common/TopStrip';
import { Toast } from './components/common/Toast';
import { ModalContainer } from './components/common/ModalContainer';

// Public views
import { CareersView } from './components/public/CareersView';
import { TrackView } from './components/public/TrackView';
import { RecruiterOnboardingView } from './components/recruiter/RecruiterOnboardingView';

// Staff views
import { DashboardView } from './components/staff/DashboardView';
import { PipelineView } from './components/staff/PipelineView';
import { TalentPoolView } from './components/staff/TalentPoolView';
import { JobOrdersView } from './components/staff/JobOrdersView';
import { ClientsView } from './components/staff/ClientsView';
import { PlacementsView } from './components/staff/PlacementsView';
import { IntakeView } from './components/staff/IntakeView';
import { DriveSyncView } from './components/staff/DriveSyncView';

// Client view
import { ClientPortalView } from './components/client/ClientPortalView';

export const AppContent: React.FC = () => {
  const { view } = useApp();

  const renderActiveView = () => {
    switch (view) {
      case 'careers':
        return <CareersView />;
      case 'track':
        return <TrackView />;
      case 'onboard':
        return <RecruiterOnboardingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'pipeline':
        return <PipelineView />;
      case 'pool':
        return <TalentPoolView />;
      case 'job-orders':
        return <JobOrdersView />;
      case 'clients':
        return <ClientsView />;
      case 'placements':
        return <PlacementsView />;
      case 'intake':
        return <IntakeView />;
      case 'drive-sync':
        return <DriveSyncView />;
      case 'client-portal':
        return <ClientPortalView />;
      default:
        return <CareersView />;
    }
  };

  return (
    <>
      <TopStrip />
      <div id="app">{renderActiveView()}</div>
      <ModalContainer />
      <Toast />
    </>
  );
};
