export const departments = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
];

export const locations = [
  "Jakarta Pusat",
  "Jakarta Selatan",
  "Bandung",
  "Surabaya",
  "Remote",
  "Yogyakarta",
];

export const jobTypes = ["Full-time", "Part-time", "Kontrak", "Magang"];

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

export const jobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Jakarta Selatan",
    type: "Full-time",
    salary: "Rp 25.000.000 - Rp 35.000.000",
    postedDate: "2025-01-15",
    description: "Bergabung dengan tim engineering kami untuk membangun antarmuka pengguna yang indah dan berkinerja tinggi yang digunakan jutaan orang setiap hari.",
    responsibilities: [
      "Mendesain dan mengimplementasi aplikasi web responsif menggunakan React dan TypeScript",
      "Berkolaborasi dengan desainer untuk menerjemahkan mockup menjadi antarmuka yang pixel-perfect",
      "Mengoptimalkan performa aplikasi dan memastikan kompatibilitas lintas browser",
      "Membimbing developer junior dan melakukan code review",
      "Berkontribusi pada keputusan arsitektur dan roadmap teknis",
    ],
    requirements: [
      "Pengalaman 5+ tahun dengan framework JavaScript modern (React diutamakan)",
      "Kemahiran kuat dalam TypeScript, HTML5, dan CSS3",
      "Pengalaman dengan solusi state management (Redux, Zustand, dll.)",
      "Familiar dengan framework testing (Jest, Cypress)",
      "Kemampuan komunikasi dan kolaborasi yang baik",
    ],
    benefits: [
      "Gaji kompetitif dan paket equity",
      "Asuransi kesehatan, gigi, dan mata komprehensif",
      "Pengaturan kerja fleksibel dan cuti tidak terbatas",
      "Budget pengembangan profesional",
      "Tunjangan setup home office",
    ],
  },
  {
    id: "2",
    title: "Product Designer",
    department: "Design",
    location: "Jakarta Pusat",
    type: "Full-time",
    salary: "Rp 18.000.000 - Rp 28.000.000",
    postedDate: "2025-01-12",
    description: "Bentuk masa depan pengalaman produk kami dengan menciptakan desain yang intuitif dan indah yang menyenangkan pengguna.",
    responsibilities: [
      "Memimpin desain end-to-end untuk fitur produk utama",
      "Membuat wireframe, prototype, dan desain high-fidelity",
      "Melakukan riset pengguna dan uji kegunaan",
      "Membangun dan memelihara design system kami",
      "Berkolaborasi erat dengan tim engineering dan product",
    ],
    requirements: [
      "Pengalaman 4+ tahun di product design",
      "Kemahiran dalam Figma dan alat prototyping",
      "Portfolio kuat yang menunjukkan pemecahan masalah UX",
      "Pengalaman dengan design systems",
      "Kemampuan visual design yang baik",
    ],
    benefits: [
      "Paket kompensasi kompetitif",
      "Benefit kesehatan dan wellness",
      "Kesempatan pembelajaran dan pengembangan",
      "Ruang kerja kreatif",
      "Acara tim reguler",
    ],
  },
  {
    id: "3",
    title: "Backend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    salary: "Rp 22.000.000 - Rp 32.000.000",
    postedDate: "2025-01-18",
    description: "Bangun sistem backend yang scalable yang mendukung platform kami dan melayani jutaan request setiap hari.",
    responsibilities: [
      "Mendesain dan mengembangkan RESTful API dan microservices",
      "Mengoptimalkan query database dan performa sistem",
      "Mengimplementasi praktik keamanan terbaik",
      "Menulis tes komprehensif dan dokumentasi",
      "Berpartisipasi dalam rotasi on-call",
    ],
    requirements: [
      "Pengalaman 4+ tahun di pengembangan backend",
      "Kemahiran di Node.js, Python, atau Go",
      "Pengalaman dengan database SQL dan NoSQL",
      "Pengetahuan platform cloud (AWS, GCP, atau Azure)",
      "Pemahaman tentang sistem terdistribusi",
    ],
    benefits: [
      "Posisi fully remote",
      "Gaji kompetitif",
      "Tunjangan peralatan",
      "Jam kerja fleksibel",
      "Retreat tahunan",
    ],
  },
  {
    id: "4",
    title: "Marketing Manager",
    department: "Marketing",
    location: "Bandung",
    type: "Full-time",
    salary: "Rp 15.000.000 - Rp 22.000.000",
    postedDate: "2025-01-08",
    description: "Dorong strategi marketing kami dan tingkatkan brand awareness di pasar-pasar kunci.",
    responsibilities: [
      "Mengembangkan dan mengeksekusi kampanye marketing",
      "Mengelola budget marketing dan tracking ROI",
      "Memimpin strategi dan pembuatan konten",
      "Menganalisis tren pasar dan aktivitas kompetitor",
      "Berkolaborasi dengan tim sales dan product",
    ],
    requirements: [
      "Pengalaman 5+ tahun di B2B marketing",
      "Rekam jejak terbukti dari kampanye sukses",
      "Kemampuan analitis dan manajemen proyek yang kuat",
      "Pengalaman dengan alat marketing automation",
      "Komunikasi tertulis dan verbal yang baik",
    ],
    benefits: [
      "Paket kompetitif",
      "Kantor di pusat kota",
      "Asuransi kesehatan swasta",
      "Skema pensiun",
      "Kesempatan perjalanan",
    ],
  },
  {
    id: "5",
    title: "Data Analyst Intern",
    department: "Product",
    location: "Surabaya",
    type: "Magang",
    salary: "Rp 4.000.000 - Rp 6.000.000/bulan",
    postedDate: "2025-01-20",
    description: "Belajar dari yang terbaik dan dapatkan pengalaman langsung dengan proyek data nyata.",
    responsibilities: [
      "Menganalisis perilaku pengguna dan metrik produk",
      "Membuat dashboard dan laporan",
      "Mendukung inisiatif A/B testing",
      "Mempresentasikan temuan kepada stakeholder",
      "Mempelajari alat dan metodologi data",
    ],
    requirements: [
      "Sedang menempuh gelar di Data Science, Statistik, atau bidang terkait",
      "Pengetahuan dasar SQL dan Python",
      "Pola pikir analitis yang kuat",
      "Semangat untuk belajar",
      "Kemampuan komunikasi yang baik",
    ],
    benefits: [
      "Program mentorship",
      "Kesempatan return offer",
      "Jadwal fleksibel",
      "Makan siang tim",
      "Sumber belajar",
    ],
  },
  {
    id: "6",
    title: "HR Business Partner",
    department: "Human Resources",
    location: "Yogyakarta",
    type: "Full-time",
    salary: "Rp 12.000.000 - Rp 18.000.000",
    postedDate: "2025-01-10",
    description: "Bermitra dengan kepemimpinan untuk membangun budaya kelas dunia dan pengalaman karyawan.",
    responsibilities: [
      "Memberikan dukungan HR strategis ke unit bisnis",
      "Mendorong inisiatif pengembangan talenta",
      "Menangani masalah hubungan karyawan",
      "Memimpin proses manajemen kinerja",
      "Mengimplementasi kebijakan dan program HR",
    ],
    requirements: [
      "Pengalaman 5+ tahun di HR",
      "Pengalaman sebagai HR Business Partner atau peran serupa",
      "Pengetahuan hukum ketenagakerjaan Indonesia",
      "Lancar berbahasa Indonesia dan Inggris",
      "Kemampuan interpersonal yang kuat",
    ],
    benefits: [
      "Gaji kompetitif",
      "Cuti 20 hari",
      "Tunjangan transportasi",
      "Asuransi kesehatan",
      "Pengembangan profesional",
    ],
  },
];

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
}

export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    title: "Merayakan Ulang Tahun ke-10 Kami",
    excerpt: "Satu dekade inovasi, pertumbuhan, dan membangun tim yang luar biasa bersama.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop",
    date: "2025-01-15",
    category: "Perusahaan",
  },
  {
    id: "2",
    title: "Kerja Remote: Pendekatan Hybrid Kami",
    excerpt: "Bagaimana kami menyeimbangkan fleksibilitas dengan kolaborasi di tempat kerja modern kami.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
    date: "2025-01-12",
    category: "Budaya",
  },
  {
    id: "3",
    title: "Kenali Tim Engineering Kami",
    excerpt: "Kenali para engineer berbakat yang membangun produk kami.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    date: "2025-01-08",
    category: "Tim",
  },
  {
    id: "4",
    title: "Inisiatif Keberlanjutan 2025",
    excerpt: "Komitmen kami terhadap tanggung jawab lingkungan dan praktik ramah lingkungan.",
    image: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=600&h=400&fit=crop",
    date: "2025-01-05",
    category: "Keberlanjutan",
  },
];

export interface Application {
  id: string;
  jobTitle: string;
  appliedDate: string;
  aiScore: number;
  stage: "Applied" | "Screening" | "HR Interview" | "Technical Interview" | "Final Interview" | "Offer" | "Hired" | "Rejected";
  nextStep: string;
}

export const candidateApplications: Application[] = [
  {
    id: "app-1",
    jobTitle: "Senior Frontend Engineer",
    appliedDate: "2025-01-15",
    aiScore: 92,
    stage: "Technical Interview",
    nextStep: "Technical interview pada 25 Januari 2025",
  },
  {
    id: "app-2",
    jobTitle: "Product Designer",
    appliedDate: "2025-01-02",
    aiScore: 78,
    stage: "Rejected",
    nextStep: "Lamaran ditutup",
  },
  {
    id: "app-3",
    jobTitle: "Backend Engineer",
    appliedDate: "2025-01-18",
    aiScore: 88,
    stage: "Screening",
    nextStep: "CV sedang direview",
  },
];

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  aiScore: number;
  experience: number;
  skills: string[];
  stage: string;
  appliedDate: string;
  source: string;
}

export const candidates: Candidate[] = [
  {
    id: "c1",
    name: "Fajar Nugroho",
    email: "fajar.nugroho@email.com",
    phone: "+62 812-1234-5678",
    position: "Senior Frontend Engineer",
    aiScore: 92,
    experience: 6,
    skills: ["React", "TypeScript", "Node.js", "CSS"],
    stage: "Technical Interview",
    appliedDate: "2025-01-15",
    source: "LinkedIn",
  },
  {
    id: "c2",
    name: "Wulan Sari",
    email: "wulan.sari@email.com",
    phone: "+62 813-2345-6789",
    position: "Backend Engineer",
    aiScore: 88,
    experience: 5,
    skills: ["Python", "Django", "PostgreSQL", "AWS"],
    stage: "HR Interview",
    appliedDate: "2025-01-18",
    source: "Referral",
  },
  {
    id: "c3",
    name: "Hendra Gunawan",
    email: "hendra.gunawan@email.com",
    phone: "+62 814-3456-7890",
    position: "Product Designer",
    aiScore: 85,
    experience: 4,
    skills: ["Figma", "UX Research", "Prototyping", "Design Systems"],
    stage: "Screening",
    appliedDate: "2025-01-20",
    source: "Website Perusahaan",
  },
  {
    id: "c4",
    name: "Rini Anggraini",
    email: "rini.anggraini@email.com",
    phone: "+62 815-4567-8901",
    position: "Senior Frontend Engineer",
    aiScore: 75,
    experience: 3,
    skills: ["React", "JavaScript", "HTML", "CSS"],
    stage: "Applied",
    appliedDate: "2025-01-22",
    source: "Jobstreet",
  },
];

export interface Requisition {
  id: string;
  title: string;
  department: string;
  quantity: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "Approved" | "Rejected" | "Revision Requested";
  requestedBy: string;
  requestedDate: string;
  salaryRange: string;
  justification: string;
}

export const requisitions: Requisition[] = [
  {
    id: "req-1",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    quantity: 2,
    priority: "High",
    status: "Approved",
    requestedBy: "Budi Santoso",
    requestedDate: "2025-01-02",
    salaryRange: "Rp 25.000.000 - Rp 35.000.000",
    justification: "Ekspansi tim untuk mendukung fitur produk baru",
  },
  {
    id: "req-2",
    title: "Product Designer",
    department: "Design",
    quantity: 1,
    priority: "Medium",
    status: "Pending",
    requestedBy: "Dewi Lestari",
    requestedDate: "2025-01-15",
    salaryRange: "Rp 18.000.000 - Rp 28.000.000",
    justification: "Mengganti anggota tim yang resign",
  },
  {
    id: "req-3",
    title: "DevOps Engineer",
    department: "Engineering",
    quantity: 1,
    priority: "Critical",
    status: "Revision Requested",
    requestedBy: "Budi Santoso",
    requestedDate: "2025-01-08",
    salaryRange: "Rp 22.000.000 - Rp 32.000.000",
    justification: "Kebutuhan infrastruktur kritis - menunggu klarifikasi budget",
  },
];
