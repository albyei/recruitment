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
  department: string;
  requestedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  submittedDate: string;
  hrFeedback?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  aiScore: number;
  skills: string[];
  experience: number;
  appliedDate: string;
  stage: PipelineStage;
  source: string;
  resumeUrl: string;
  linkedIn?: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  event: string;
  description: string;
  user?: string;
}

export type PipelineStage = 
  | 'applied' 
  | 'selected' 
  | 'contacted' 
  | 'hr-interview' 
  | 'user-interview' 
  | 'salary-negotiation' 
  | 'hired' 
  | 'rejected';

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  interviewers: string[];
  type: 'hr' | 'technical' | 'final';
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink?: string;
  aiScore?: number;
}

export interface AnalyticsData {
  timeToHire: number;
  costPerHire: number;
  quarterlyData: { quarter: string; openings: number; fills: number }[];
  candidateSources: { source: string; count: number; percentage: number }[];
  rejectionReasons: { reason: string; count: number; percentage: number }[];
}

export const pipelineStages: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { key: 'selected', label: 'Selected', color: 'bg-purple-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-indigo-500' },
  { key: 'hr-interview', label: 'HR Interview', color: 'bg-cyan-500' },
  { key: 'user-interview', label: 'User Interview', color: 'bg-teal-500' },
  { key: 'salary-negotiation', label: 'Salary Negotiation', color: 'bg-amber-500' },
  { key: 'hired', label: 'Hired', color: 'bg-green-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export const mockMPPRequests: MPPRequest[] = [
  {
    id: 'mpp-1',
    title: 'Senior Software Engineer',
    aboutRole: 'We are looking for a Senior Software Engineer to join our growing engineering team. You will be responsible for designing and implementing scalable solutions.',
    responsibilities: '• Lead technical design and architecture decisions\n• Mentor junior developers\n• Write clean, maintainable code\n• Participate in code reviews\n• Collaborate with product team',
    requirements: '• 5+ years of experience in software development\n• Strong proficiency in React and Node.js\n• Experience with cloud services (AWS/GCP)\n• Excellent problem-solving skills',
    benefits: '• Competitive salary\n• Health insurance\n• Flexible working hours\n• Remote work options\n• Professional development budget',
    salaryMin: 20000000,
    salaryMax: 30000000,
    datePosted: '2025-01-10',
    quantity: 2,
    justification: 'Team expansion to support new product launch',
    department: 'Engineering',
    requestedBy: 'Budi Santoso',
    priority: 'high',
    status: 'pending',
    submittedDate: '2025-01-10',
  },
  {
    id: 'mpp-2',
    title: 'Marketing Manager',
    aboutRole: 'We are seeking a Marketing Manager to lead our marketing initiatives and drive brand growth across multiple channels.',
    responsibilities: '• Develop marketing strategies\n• Manage marketing budget\n• Lead marketing campaigns\n• Analyze market trends\n• Build brand awareness',
    requirements: '• 7+ years of marketing experience\n• Strong leadership skills\n• Experience with digital marketing\n• Excellent communication skills',
    benefits: '• Competitive salary\n• Performance bonus\n• Health insurance\n• Company car allowance',
    salaryMin: 15000000,
    salaryMax: 22000000,
    datePosted: '2025-01-08',
    quantity: 1,
    justification: 'Replacing team lead who resigned',
    department: 'Marketing',
    requestedBy: 'Dewi Lestari',
    priority: 'medium',
    status: 'pending',
    submittedDate: '2025-01-08',
  },
  {
    id: 'mpp-3',
    title: 'Data Analyst',
    aboutRole: 'Join our analytics team to help drive data-driven decisions across the organization.',
    responsibilities: '• Analyze complex datasets\n• Create dashboards and reports\n• Support business decisions with data insights\n• Develop predictive models',
    requirements: '• 3+ years of data analysis experience\n• Proficiency in SQL and Python\n• Experience with visualization tools\n• Strong analytical skills',
    benefits: '• Competitive salary\n• Learning budget\n• Health insurance\n• Flexible hours',
    salaryMin: 12000000,
    salaryMax: 18000000,
    datePosted: '2025-01-05',
    quantity: 3,
    justification: 'Setting up new analytics department',
    department: 'Analytics',
    requestedBy: 'Ahmad Wijaya',
    priority: 'urgent',
    status: 'pending',
    submittedDate: '2025-01-05',
  },
  {
    id: 'mpp-4',
    title: 'UX Designer',
    aboutRole: 'We are looking for a creative UX Designer to enhance our product user experience.',
    responsibilities: '• Design user interfaces\n• Conduct user research\n• Create wireframes and prototypes\n• Collaborate with developers',
    requirements: '• 4+ years of UX design experience\n• Proficiency in Figma\n• Strong portfolio\n• User research skills',
    benefits: '• Competitive salary\n• Creative environment\n• Health insurance\n• Remote work options',
    salaryMin: 14000000,
    salaryMax: 20000000,
    datePosted: '2025-01-02',
    quantity: 1,
    justification: 'Strengthening design team',
    department: 'Design',
    requestedBy: 'Putri Maharani',
    priority: 'low',
    status: 'approved',
    submittedDate: '2025-01-02',
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Ratna Sari Dewi',
    email: 'ratna.sari@email.com',
    phone: '+62 812-1111-2222',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    aiScore: 92,
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    experience: 6,
    appliedDate: '2025-01-12',
    stage: 'hr-interview',
    source: 'LinkedIn',
    resumeUrl: '/resumes/ratna-sari.pdf',
    linkedIn: 'https://linkedin.com/in/ratnasari',
    timeline: [
      { id: 't1', date: '2025-01-12', event: 'Melamar', description: 'Mengirim lamaran via LinkedIn' },
      { id: 't2', date: '2025-01-13', event: 'AI Screening', description: 'Skor AI: 92/100' },
      { id: 't3', date: '2025-01-14', event: 'Pindah ke Screening', description: 'Lolos persyaratan awal', user: 'Tim HR' },
      { id: 't4', date: '2025-01-15', event: 'Phone Screen', description: 'Selesai phone screen 30 menit', user: 'Siti Nurhaliza' },
      { id: 't5', date: '2025-01-16', event: 'Interview HR Dijadwalkan', description: 'Interview dijadwalkan 18 Jan', user: 'Siti Nurhaliza' },
    ],
  },
  {
    id: 'cand-2',
    name: 'Agus Hermawan',
    email: 'agus.hermawan@email.com',
    phone: '+62 813-2222-3333',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    aiScore: 88,
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    experience: 5,
    appliedDate: '2025-01-11',
    stage: 'selected',
    source: 'Jobstreet',
    resumeUrl: '/resumes/agus-hermawan.pdf',
    timeline: [
      { id: 't1', date: '2025-01-11', event: 'Melamar', description: 'Mengirim lamaran via Jobstreet' },
      { id: 't2', date: '2025-01-12', event: 'AI Screening', description: 'Skor AI: 88/100' },
      { id: 't3', date: '2025-01-13', event: 'Pindah ke Screening', description: 'Sedang direview', user: 'Tim HR' },
    ],
  },
  {
    id: 'cand-3',
    name: 'Lina Kusuma',
    email: 'lina.kusuma@email.com',
    phone: '+62 814-3333-4444',
    position: 'Marketing Manager',
    department: 'Marketing',
    aiScore: 85,
    skills: ['Digital Marketing', 'SEO', 'Analytics', 'Content Strategy'],
    experience: 7,
    appliedDate: '2025-01-10',
    stage: 'user-interview',
    source: 'Referral',
    resumeUrl: '/resumes/lina-kusuma.pdf',
    linkedIn: 'https://linkedin.com/in/linakusuma',
    timeline: [
      { id: 't1', date: '2025-01-10', event: 'Melamar', description: 'Direferensikan oleh karyawan' },
      { id: 't2', date: '2025-01-11', event: 'AI Screening', description: 'Skor AI: 85/100' },
      { id: 't3', date: '2025-01-12', event: 'Interview HR', description: 'Selesai interview HR', user: 'Siti Nurhaliza' },
      { id: 't4', date: '2025-01-14', event: 'Interview User Dijadwalkan', description: 'Technical round dijadwalkan', user: 'Dewi Lestari' },
    ],
  },
  {
    id: 'cand-4',
    name: 'Dimas Putra',
    email: 'dimas.putra@email.com',
    phone: '+62 815-4444-5555',
    position: 'Data Analyst',
    department: 'Analytics',
    aiScore: 78,
    skills: ['SQL', 'Python', 'Tableau', 'Excel'],
    experience: 3,
    appliedDate: '2025-01-09',
    stage: 'applied',
    source: 'Website Perusahaan',
    resumeUrl: '/resumes/dimas-putra.pdf',
    timeline: [
      { id: 't1', date: '2025-01-09', event: 'Melamar', description: 'Mengirim via website perusahaan' },
      { id: 't2', date: '2025-01-10', event: 'AI Screening', description: 'Skor AI: 78/100' },
    ],
  },
  {
    id: 'cand-5',
    name: 'Maya Indah',
    email: 'maya.indah@email.com',
    phone: '+62 816-5555-6666',
    position: 'UX Designer',
    department: 'Design',
    aiScore: 94,
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    experience: 4,
    appliedDate: '2025-01-08',
    stage: 'salary-negotiation',
    source: 'LinkedIn',
    resumeUrl: '/resumes/maya-indah.pdf',
    linkedIn: 'https://linkedin.com/in/mayaindah',
    timeline: [
      { id: 't1', date: '2025-01-08', event: 'Melamar', description: 'Mengirim via LinkedIn' },
      { id: 't2', date: '2025-01-09', event: 'AI Screening', description: 'Skor AI: 94/100' },
      { id: 't3', date: '2025-01-10', event: 'Interview HR', description: 'Cultural fit sangat baik', user: 'Siti Nurhaliza' },
      { id: 't4', date: '2025-01-12', event: 'Portfolio Review', description: 'Portfolio luar biasa', user: 'Putri Maharani' },
      { id: 't5', date: '2025-01-14', event: 'Offer Dikirim', description: 'Negosiasi terms gaji', user: 'Tim HR' },
    ],
  },
  {
    id: 'cand-6',
    name: 'Rendra Pratama',
    email: 'rendra.pratama@email.com',
    phone: '+62 817-6666-7777',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    aiScore: 72,
    skills: ['Java', 'Spring Boot', 'Kubernetes'],
    experience: 8,
    appliedDate: '2025-01-07',
    stage: 'rejected',
    source: 'Jobstreet',
    resumeUrl: '/resumes/rendra-pratama.pdf',
    timeline: [
      { id: 't1', date: '2025-01-07', event: 'Melamar', description: 'Mengirim via Jobstreet' },
      { id: 't2', date: '2025-01-08', event: 'AI Screening', description: 'Skor AI: 72/100' },
      { id: 't3', date: '2025-01-09', event: 'Ditolak', description: 'Skills tidak sesuai untuk posisi saat ini', user: 'Tim HR' },
    ],
  },
  {
    id: 'cand-7',
    name: 'Anisa Fitri',
    email: 'anisa.fitri@email.com',
    phone: '+62 818-7777-8888',
    position: 'Data Analyst',
    department: 'Analytics',
    aiScore: 89,
    skills: ['R', 'Python', 'Machine Learning', 'Statistics'],
    experience: 4,
    appliedDate: '2025-01-06',
    stage: 'hired',
    source: 'Referral',
    resumeUrl: '/resumes/anisa-fitri.pdf',
    linkedIn: 'https://linkedin.com/in/anisafitri',
    timeline: [
      { id: 't1', date: '2025-01-06', event: 'Melamar', description: 'Direferensikan oleh tim analytics' },
      { id: 't2', date: '2025-01-07', event: 'AI Screening', description: 'Skor AI: 89/100' },
      { id: 't3', date: '2025-01-08', event: 'Interview HR', description: 'Kandidat kuat', user: 'Siti Nurhaliza' },
      { id: 't4', date: '2025-01-10', event: 'Technical Interview', description: 'Lulus dengan sangat baik', user: 'Ahmad Wijaya' },
      { id: 't5', date: '2025-01-12', event: 'Offer Diterima', description: 'Mulai 1 Februari', user: 'Tim HR' },
    ],
  },
  {
    id: 'cand-8',
    name: 'Teguh Wijaya',
    email: 'teguh.wijaya@email.com',
    phone: '+62 819-8888-9999',
    position: 'Marketing Manager',
    department: 'Marketing',
    aiScore: 81,
    skills: ['Brand Management', 'Campaign Planning', 'Team Leadership'],
    experience: 9,
    appliedDate: '2025-01-05',
    stage: 'contacted',
    source: 'LinkedIn',
    resumeUrl: '/resumes/teguh-wijaya.pdf',
    timeline: [
      { id: 't1', date: '2025-01-05', event: 'Melamar', description: 'Mengirim via LinkedIn' },
      { id: 't2', date: '2025-01-06', event: 'AI Screening', description: 'Skor AI: 81/100' },
      { id: 't3', date: '2025-01-07', event: 'Kontak Awal', description: 'Email dikirim untuk phone screen', user: 'Siti Nurhaliza' },
    ],
  },
];

export const mockInterviews: Interview[] = [
  {
    id: 'int-1',
    candidateId: 'cand-1',
    candidateName: 'Ratna Sari Dewi',
    position: 'Senior Software Engineer',
    scheduledDate: '2025-01-18',
    scheduledTime: '10:00',
    duration: 60,
    interviewers: ['Siti Nurhaliza', 'Budi Santoso'],
    type: 'hr',
    status: 'scheduled',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    aiScore: 92,
  },
  {
    id: 'int-2',
    candidateId: 'cand-3',
    candidateName: 'Lina Kusuma',
    position: 'Marketing Manager',
    scheduledDate: '2025-01-19',
    scheduledTime: '14:00',
    duration: 45,
    interviewers: ['Dewi Lestari', 'Teguh Marketing'],
    type: 'technical',
    status: 'scheduled',
    meetingLink: 'https://meet.google.com/klm-nopq-rst',
    aiScore: 85,
  },
  {
    id: 'int-3',
    candidateId: 'cand-5',
    candidateName: 'Maya Indah',
    position: 'UX Designer',
    scheduledDate: '2025-01-17',
    scheduledTime: '11:00',
    duration: 30,
    interviewers: ['Putri Maharani'],
    type: 'final',
    status: 'completed',
    aiScore: 94,
  },
];

export const mockAnalytics: AnalyticsData = {
  timeToHire: 28,
  costPerHire: 7500000,
  quarterlyData: [
    { quarter: 'Q1 2024', openings: 15, fills: 12 },
    { quarter: 'Q2 2024', openings: 20, fills: 18 },
    { quarter: 'Q3 2024', openings: 25, fills: 20 },
    { quarter: 'Q4 2024', openings: 18, fills: 16 },
    { quarter: 'Q1 2025', openings: 22, fills: 8 },
  ],
  candidateSources: [
    { source: 'LinkedIn', count: 145, percentage: 35 },
    { source: 'Jobstreet', count: 98, percentage: 24 },
    { source: 'Referral', count: 82, percentage: 20 },
    { source: 'Website Perusahaan', count: 54, percentage: 13 },
    { source: 'Job Fair', count: 33, percentage: 8 },
  ],
  rejectionReasons: [
    { reason: 'Skills Tidak Sesuai', count: 45, percentage: 30 },
    { reason: 'Level Pengalaman', count: 38, percentage: 25 },
    { reason: 'Ekspektasi Gaji', count: 30, percentage: 20 },
    { reason: 'Cultural Fit', count: 23, percentage: 15 },
    { reason: 'Gagal Technical', count: 15, percentage: 10 },
  ],
};

export const availableTimeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

export const mockCalendarAvailability = {
  '2025-01-18': ['09:00', '10:30', '14:00', '15:30'],
  '2025-01-19': ['09:30', '11:00', '13:00', '14:30', '16:00'],
  '2025-01-20': ['10:00', '11:30', '13:30', '15:00'],
  '2025-01-22': ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  '2025-01-23': ['09:30', '10:30', '13:00', '14:30'],
};
