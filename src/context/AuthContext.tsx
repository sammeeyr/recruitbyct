import React, { createContext, useContext, useEffect, useState } from 'react';
import { Permission, ROLE_PERMISSIONS, UserRole, UserSession } from '../types/auth';

export const SYSTEM_USERS: UserSession[] = [
  {
    id: 'u_recruiter',
    name: 'Folake Adeyemi',
    email: 'folake@cubetechconsults.com',
    role: 'recruiter',
    title: 'Senior Recruiter',
    location: 'Abuja',
    phone: '0803 555 0199',
    token: 'jwt_recruiter_folake_2026'
  },
  {
    id: 'u_admin',
    name: 'Tunde Balogun',
    email: 'tunde@cubetechconsults.com',
    role: 'agency_admin',
    title: 'Managing Director',
    location: 'Lagos',
    phone: '0802 333 4455',
    token: 'jwt_admin_tunde_2026'
  },
  {
    id: 'u_client_nexus',
    name: 'Chinelo Obi',
    email: 'chinelo.obi@nexusmfb.ng',
    role: 'client',
    clientId: 'c1',
    clientName: 'Nexus Microfinance Bank',
    title: 'Head of People & Culture',
    location: 'Abuja',
    phone: '0803 111 2233',
    token: 'jwt_client_nexus_2026'
  },
  {
    id: 'u_client_savanna',
    name: 'Musa Danladi',
    email: 'musa.danladi@savanna.ng',
    role: 'client',
    clientId: 'c2',
    clientName: 'Savanna Logistics',
    title: 'Operations Director',
    location: 'Lagos',
    phone: '0805 777 8899',
    token: 'jwt_client_savanna_2026'
  },
  {
    id: 'u_candidate',
    name: 'Ifeoma Chukwu',
    email: 'ifeoma.chukwu@example.com',
    role: 'candidate',
    title: 'Candidate / Applicant',
    location: 'Abuja',
    phone: '0803 555 0101',
    token: 'jwt_candidate_ifeoma_2026'
  }
];

interface AuthContextType {
  user: UserSession;
  allUsers: UserSession[];
  setUser: (user: UserSession) => void;
  switchUser: (userId: string) => void;
  hasPermission: (permission: Permission) => boolean;
  canAccessAts: boolean;
  canAccessClientPortal: boolean;
  canAccessPublic: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'recruitbyct_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Default to Recruiter
    return SYSTEM_USERS[0];
  });

  const setUser = (newUser: UserSession) => {
    setUserState(newUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const switchUser = (userId: string) => {
    const target = SYSTEM_USERS.find(u => u.id === userId);
    if (target) {
      setUser(target);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  };

  const canAccessAts = user.role === 'recruiter' || user.role === 'agency_admin';
  const canAccessClientPortal = user.role === 'client' || user.role === 'recruiter' || user.role === 'agency_admin';
  const canAccessPublic = true;

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers: SYSTEM_USERS,
        setUser,
        switchUser,
        hasPermission,
        canAccessAts,
        canAccessClientPortal,
        canAccessPublic
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
