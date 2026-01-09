export interface CandidateApplication {
  id: string;
  position: string;
  department: string;
  appliedDate: string;
  aiScore: number;
  currentStage: 'Under Review' | 'Interview' | 'User Interview' | 'Rejected' | 'Hired' | 'Screening' | 'Salary Negotiation';
  nextStep: string;
}

export interface CandidateProfile {
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

export const mockCandidateProfile: CandidateProfile = {
  id: '1',
  fullName: 'Andi Prasetyo',
  email: 'andi.prasetyo@email.com',
  phone: '+62 812 3456 7890',
  address: 'Jakarta Selatan, DKI Jakarta',
  linkedinUrl: 'https://linkedin.com/in/andiprasetyo',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  resumeFileName: 'Andi_Prasetyo_CV.pdf',
  resumeUploadDate: '2025-01-15',
};

export const mockCandidateApplications: CandidateApplication[] = [
  {
    id: '1',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    appliedDate: '2025-01-15',
    aiScore: 92,
    currentStage: 'Interview',
    nextStep: 'Technical interview scheduled for Jan 20, 2025',
  },
  {
    id: '2',
    position: 'Product Manager',
    department: 'Product',
    appliedDate: '2025-01-10',
    aiScore: 78,
    currentStage: 'Screening',
    nextStep: 'Awaiting HR review',
  },
  {
    id: '3',
    position: 'UX Designer',
    department: 'Design',
    appliedDate: '2025-01-05',
    aiScore: 85,
    currentStage: 'User Interview',
    nextStep: 'Final interview with Design Lead on Jan 22, 2025',
  },
  {
    id: '4',
    position: 'Data Analyst',
    department: 'Analytics',
    appliedDate: '2024-12-20',
    aiScore: 65,
    currentStage: 'Rejected',
    nextStep: 'Application closed',
  },
  {
    id: '5',
    position: 'Marketing Specialist',
    department: 'Marketing',
    appliedDate: '2024-12-15',
    aiScore: 88,
    currentStage: 'Salary Negotiation',
    nextStep: 'Offer letter being prepared',
  },
  {
    id: '6',
    position: 'DevOps Engineer',
    department: 'Engineering',
    appliedDate: '2025-01-08',
    aiScore: 95,
    currentStage: 'Hired',
    nextStep: 'Onboarding starts Feb 1, 2025',
  },
  {
    id: '7',
    position: 'Business Analyst',
    department: 'Operations',
    appliedDate: '2025-01-12',
    aiScore: 72,
    currentStage: 'Under Review',
    nextStep: 'Resume under review by hiring manager',
  },
];

export const getApplicationStatusCounts = () => {
  const counts = {
    underReview: 0,
    interview: 0,
    rejected: 0,
    hired: 0,
  };

  mockCandidateApplications.forEach((app) => {
    switch (app.currentStage) {
      case 'Under Review':
      case 'Screening':
        counts.underReview++;
        break;
      case 'Interview':
      case 'Salary Negotiation':
        counts.interview++;
        break;
      case 'Rejected':
        counts.rejected++;
        break;
      case 'Hired':
        counts.hired++;
        break;
    }
  });

  return counts;
};
