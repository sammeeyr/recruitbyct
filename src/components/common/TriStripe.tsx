import React from 'react';

export const TriStripe: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`tri ${className}`} aria-hidden="true" />;
};
