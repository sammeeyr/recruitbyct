import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      {toast}
    </div>
  );
};
