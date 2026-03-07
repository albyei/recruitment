import { createContext, useContext, useState, ReactNode } from 'react';
import { mockCandidateProfile, CandidateProfile } from '@/lib/mockCandidateData';

export interface CandidateUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedinUrl: string;
  avatarUrl: string;
  resumeFileName: string | null;
  resumeUploadDate: string | null;
}

interface CandidateAuthContextType {
  candidate: CandidateUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { fullName: string; email: string; phone?: string; linkedinUrl?: string; address?: string }) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: boolean;
}

const CandidateAuthContext = createContext<CandidateAuthContextType | undefined>(undefined);

// Mock registered candidates
const mockRegisteredCandidates: CandidateUser[] = [
  { ...mockCandidateProfile },
];

export function CandidateAuthProvider({ children }: { children: ReactNode }) {
  const [candidate, setCandidate] = useState<CandidateUser | null>(() => {
    const stored = localStorage.getItem('candidate_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, _password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800));
    const found = mockRegisteredCandidates.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );
    if (found) {
      setCandidate(found);
      localStorage.setItem('candidate_user', JSON.stringify(found));
      return true;
    }
    // Also check dynamically registered candidates from localStorage
    const dynamicUsers: CandidateUser[] = JSON.parse(localStorage.getItem('candidate_registered_users') || '[]');
    const dynamicFound = dynamicUsers.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (dynamicFound) {
      setCandidate(dynamicFound);
      localStorage.setItem('candidate_user', JSON.stringify(dynamicFound));
      return true;
    }
    return false;
  };

  const register = async (data: { fullName: string; email: string; phone?: string; linkedinUrl?: string; address?: string }): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800));
    const newUser: CandidateUser = {
      id: `candidate-${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '',
      address: data.address || '',
      linkedinUrl: data.linkedinUrl || '',
      avatarUrl: '',
      resumeFileName: null,
      resumeUploadDate: null,
    };
    // Store in dynamic list
    const dynamicUsers: CandidateUser[] = JSON.parse(localStorage.getItem('candidate_registered_users') || '[]');
    dynamicUsers.push(newUser);
    localStorage.setItem('candidate_registered_users', JSON.stringify(dynamicUsers));
    // Auto-login
    setCandidate(newUser);
    localStorage.setItem('candidate_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCandidate(null);
    localStorage.removeItem('candidate_user');
  };

  return (
    <CandidateAuthContext.Provider value={{ candidate, login, register, logout, isLoggedIn: !!candidate }}>
      {children}
    </CandidateAuthContext.Provider>
  );
}

export function useCandidateAuth() {
  const ctx = useContext(CandidateAuthContext);
  if (!ctx) throw new Error('useCandidateAuth must be used within CandidateAuthProvider');
  return ctx;
}
