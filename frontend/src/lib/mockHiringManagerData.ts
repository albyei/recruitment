export interface Requisition {
  id: string;
  title: string;
  department: string;
  quantity: number;
  filled: number;
  status: 'open' | 'closed' | 'pending';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface ForwardedCandidate {
  id: string;
  name: string;
  position: string;
  requisitionId: string;
  aiScore: number;
  forwardedDate: string;
  status: 'pending_review' | 'interview_scheduled' | 'interviewed' | 'rejected' | 'hired';
  interviewFeedback?: string;
  interviewScore?: number;
  interviewDate?: string;
  interviewTime?: string;
  meetingLink?: string;
}

export interface MPPRequest {
  id: string;
  title: string;
  aboutRole: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  salaryMin: number;
  salaryMax: number;
  datePosted: string;
  quantity: number;
  justification: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt: string;
  feedback?: string;
}

export interface HeadcountData {
  department: string;
  headcount: number;
  vacancy: number;
}

export const mockHeadcountData: HeadcountData[] = [
  { department: 'Engineering', headcount: 45, vacancy: 8 },
  { department: 'Marketing', headcount: 20, vacancy: 3 },
  { department: 'Sales', headcount: 35, vacancy: 5 },
  { department: 'HR', headcount: 12, vacancy: 2 },
  { department: 'Finance', headcount: 18, vacancy: 1 },
];

export const mockRequisitions: Requisition[] = [
  {
    id: 'REQ001',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    quantity: 3,
    filled: 1,
    status: 'open',
    priority: 'high',
    createdAt: '2025-01-15',
  },
  {
    id: 'REQ002',
    title: 'Product Manager',
    department: 'Engineering',
    quantity: 1,
    filled: 0,
    status: 'open',
    priority: 'medium',
    createdAt: '2025-01-20',
  },
  {
    id: 'REQ003',
    title: 'Marketing Specialist',
    department: 'Marketing',
    quantity: 2,
    filled: 1,
    status: 'open',
    priority: 'low',
    createdAt: '2025-01-25',
  },
  {
    id: 'REQ004',
    title: 'Sales Representative',
    department: 'Sales',
    quantity: 5,
    filled: 3,
    status: 'open',
    priority: 'high',
    createdAt: '2025-02-01',
  },
];

export const mockForwardedCandidates: ForwardedCandidate[] = [
  {
    id: 'FC001',
    name: 'Ratna Sari Dewi',
    position: 'Senior Software Engineer',
    requisitionId: 'REQ001',
    aiScore: 92,
    forwardedDate: '2025-02-10',
    status: 'pending_review',
  },
  {
    id: 'FC002',
    name: 'Agus Hermawan',
    position: 'Senior Software Engineer',
    requisitionId: 'REQ001',
    aiScore: 88,
    forwardedDate: '2025-02-11',
    status: 'interview_scheduled',
    interviewDate: '2025-02-20',
    interviewTime: '10:00',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'FC003',
    name: 'Lina Kusuma',
    position: 'Product Manager',
    requisitionId: 'REQ002',
    aiScore: 85,
    forwardedDate: '2025-02-12',
    status: 'interviewed',
    interviewFeedback: 'Kemampuan analitis kuat, cocok dengan budaya perusahaan.',
    interviewScore: 4,
  },
  {
    id: 'FC004',
    name: 'Dimas Putra',
    position: 'Marketing Specialist',
    requisitionId: 'REQ003',
    aiScore: 78,
    forwardedDate: '2025-02-13',
    status: 'interview_scheduled',
    interviewDate: '2025-02-22',
    interviewTime: '14:30',
    meetingLink: 'https://zoom.us/j/123456789',
  },
  {
    id: 'FC005',
    name: 'Maya Indah',
    position: 'Sales Representative',
    requisitionId: 'REQ004',
    aiScore: 91,
    forwardedDate: '2025-02-14',
    status: 'hired',
    interviewFeedback: 'Komunikasi sangat baik, rekam jejak terbukti.',
    interviewScore: 5,
  },
];

export const mockMPPRequests: MPPRequest[] = [
  {
    id: 'MPP001',
    title: 'Backend Developer',
    aboutRole: 'We are looking for a skilled Backend Developer to join our engineering team and help build scalable server-side applications.',
    responsibilities: '• Design and implement APIs\n• Optimize database queries\n• Write unit and integration tests\n• Collaborate with frontend team',
    requirements: '• 5+ years experience with Node.js and PostgreSQL\n• Experience with cloud services\n• Strong problem-solving skills',
    benefits: '• Competitive salary\n• Health insurance\n• Remote work options\n• Learning budget',
    salaryMin: 15000000,
    salaryMax: 25000000,
    datePosted: '2025-01-10',
    quantity: 2,
    justification: 'Team expansion needed for new product launch.',
    priority: 'high',
    status: 'rejected',
    submittedAt: '2025-01-10',
    feedback: 'Budget constraints. Please revise salary range or reduce quantity.',
  },
  {
    id: 'MPP002',
    title: 'UX Designer',
    aboutRole: 'Join our design team to create exceptional user experiences across our product suite.',
    responsibilities: '• Conduct user research\n• Create wireframes and prototypes\n• Design user interfaces\n• Collaborate with developers',
    requirements: '• 3+ years experience in Figma\n• User research experience\n• Strong portfolio\n• Prototyping skills',
    benefits: '• Creative environment\n• Health insurance\n• Flexible hours\n• Professional development',
    salaryMin: 12000000,
    salaryMax: 18000000,
    datePosted: '2025-01-15',
    quantity: 1,
    justification: 'Current designer is overloaded with projects.',
    priority: 'medium',
    status: 'revision_requested',
    submittedAt: '2025-01-15',
    feedback: 'Please provide more details about project timeline and workload distribution.',
  },
  {
    id: 'MPP003',
    title: 'DevOps Engineer',
    aboutRole: 'We need a DevOps Engineer to help us scale our infrastructure and improve deployment processes.',
    responsibilities: '• Manage CI/CD pipelines\n• Monitor system performance\n• Implement security best practices\n• Automate infrastructure',
    requirements: '• 4+ years experience with AWS, Docker, Kubernetes\n• Scripting skills\n• Infrastructure as code experience',
    benefits: '• Competitive salary\n• Health insurance\n• Remote work\n• Stock options',
    salaryMin: 18000000,
    salaryMax: 28000000,
    datePosted: '2025-01-20',
    quantity: 1,
    justification: 'Critical for infrastructure scaling.',
    priority: 'high',
    status: 'approved',
    submittedAt: '2025-01-20',
  },
];

export const getPipelineSummary = () => {
  const summary = {
    pendingReview: 0,
    interviewScheduled: 0,
    interviewed: 0,
    hired: 0,
    rejected: 0,
  };

  mockForwardedCandidates.forEach((candidate) => {
    switch (candidate.status) {
      case 'pending_review':
        summary.pendingReview++;
        break;
      case 'interview_scheduled':
        summary.interviewScheduled++;
        break;
      case 'interviewed':
        summary.interviewed++;
        break;
      case 'hired':
        summary.hired++;
        break;
      case 'rejected':
        summary.rejected++;
        break;
    }
  });

  return summary;
};
