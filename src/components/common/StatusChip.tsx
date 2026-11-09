import React from 'react';
import { JobStatus } from '../../types';

interface StatusChipProps {
  status: JobStatus | string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const getStyle = (st: string) => {
    switch (st) {
      case 'Open':
      case 'open':
      case 'Synced':
      case 'Published':
      case 'Approved':
      case 'Linked':
      case 'active':
        return 'open';
      case 'Closing soon':
      case 'soon':
      case 'Ending soon':
      case 'warn':
      case 'Queued':
      case 'Needs approval':
        return 'soon';
      case 'Filled':
      case 'filled':
        return 'filled';
      case 'Closed':
      case 'closed':
      case 'Paused':
        return 'closed';
      case 'Draft':
      case 'draft':
      case 'Disconnected':
      case 'Needs review':
      case 'Left on day':
      case 'red':
        return 'red';
      default:
        return '';
    }
  };

  const styleClass = getStyle(status);

  return (
    <span className={`chip ${styleClass} ${className}`}>
      <span className="dot" />
      {status}
    </span>
  );
};
