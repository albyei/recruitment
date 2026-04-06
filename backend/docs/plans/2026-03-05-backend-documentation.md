# Dokumentasi Sistem Rekrutmen - Logika, Operasi & Backend Endpoints

*Tanggal: 2026-03-05*

---

## 1. Semua Backend Endpoints

### Endpoints Publik (Tanpa Autentikasi)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Cek status API |
| `GET` | `/api/v1/jobs` | Dapatkan semua lowongan kerja yang dipublikasikan (filter: department, lokasi, tipe, prioritas) |
| `GET` | `/api/v1/jobs/:slug` | Dapatkan detail lowongan berdasarkan slug |
| `POST` | `/api/v1/jobs/:slug/apply` | Melamar pekerjaan (membuat kandidat jika belum ada) |

### Endpoints Autentikasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/auth/register` | Registrasi pengguna |
| `POST` | `/api/v1/auth/login` | Login pengguna |

### Manajemen Profil (Terproteksi)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/v1/profile` | Dapatkan profil pengguna saat ini |
| `PUT` | `/api/v1/profile` | Update profil pengguna saat ini |
| `DELETE` | `/api/v1/me` | Hapus akun pengguna saat ini |

### Operasi Admin (Hanya Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/admin/users` | Buat pengguna oleh admin |
| `GET` | `/api/v1/admin/users` | Dapatkan semua pengguna |

### Operasi HR (Hanya HR)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/hr/news-cultures` | Buat artikel berita |
| `GET` | `/api/v1/hr/news-cultures` | Dapatkan semua berita |
| `GET` | `/api/v1/hr/news-cultures/:id` | Dapatkan berita berdasarkan ID |
| `PUT` | `/api/v1/hr/news-cultures/:id` | Update berita |
| `DELETE` | `/api/v1/hr/news-cultures/:id` | Hapus berita |
| `POST` | `/api/v1/hr/departments` | Buat department |
| `GET` | `/api/v1/hr/departments` | Dapatkan semua department |
| `GET` | `/api/v1/hr/departments/:id` | Dapatkan department berdasarkan ID |
| `PUT` | `/api/v1/hr/departments/:id` | Update department |
| `DELETE` | `/api/v1/hr/departments/:id` | Hapus department |
| `GET` | `/api/v1/hr/jobs` | Dapatkan semua lowongan kerja |
| `DELETE` | `/api/v1/hr/jobs/:id` | Hapus lowongan kerja |
| `PATCH` | `/api/v1/hr/jobs/:id/close` | Tutup lowongan kerja |
| `PATCH` | `/api/v1/hr/jobs/:id/approve` | Setujui lowongan kerja |
| `PATCH` | `/api/v1/hr/jobs/:id/reject` | Tolak lowongan kerja (dengan alasan) |
| `GET` | `/api/v1/hr/applications` | Dapatkan semua lamaran |
| `GET` | `/api/v1/hr/jobs/:id/applications` | Dapatkan lamaran berdasarkan lowongan |
| `PATCH` | `/api/v1/hr/applications/:id/status` | Update status lamaran |

### Operasi Hiring Manager (Hanya Hiring Manager)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/hiring_manager/jobs` | Buat lowongan kerja |
| `GET` | `/api/v1/hiring_manager/jobs` | Dapatkan semua lowongan untuk hiring manager |
| `PUT` | `/api/v1/hiring_manager/jobs/:id` | Update lowongan kerja |
| `PATCH` | `/api/v1/hiring_manager/jobs/:id/submit` | Kirim lowongan untuk persetujuan |
| `PATCH` | `/api/v1/hiring_manager/jobs/:id/publish` | Publikasikan lowongan yang disetujui |

### Operasi Kandidat (Hanya Kandidat)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/v1/candidate/applications` | Dapatkan lamaran kandidat |
| `DELETE` | `/api/v1/candidate/applications/:id` | Tarik lamaran |
| `PUT` | `/api/v1/candidate/applications/:id` | Edit lamaran |

### Endpoint Setup (Hanya Development)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/setup-first-admin` | Buat admin pertama (membutuhkan env `SETUP_SECRET`) |

---

## 2. Logika Bisnis Inti

### Peran & Hak Akses Pengguna
| Peran | Kemampuan |
|------|------------|
| **Kandidat** | Melamar pekerjaan, lihat/edit lamaran, tarik lamaran |
| **HR** | Kelola department, berita, lihat semua lamaran, update status lamaran |
| **Hiring Manager** | Buat/kelola lowongan, kirim untuk persetujuan, publikasikan lowongan yang disetujui |
| **Admin** | Akses penuh sistem, kelola pengguna, semua operasi |

### Alur Siklus Lowongan Kerja
```
Draft (Dibuat oleh Hiring Manager)
    ↓
Pending Approval (Dikirim oleh Hiring Manager)
    ↓
Approved (Disetujui oleh Admin)
    ↓
Published (Dipublikasikan oleh Hiring Manager) → Menerima Lamaran
    ↓
Closed (Tidak menerima lamaran lagi)
    ↓
Cancelled ATAU Rejected (dengan alasan)
```

### Alur Status Lamaran
```
Applied (Melamar)
    ↓
Screening (Saringan awal)
    ↓
Contacted (Dihubungi)
    ↓
HR Interview (Wawancara HR)
    ↓
Hiring Manager Interview (Wawancara Hiring Manager)
    ↓
Salary Negotiation (Negosiasi Gaji)
    ↓
Hired ATAU Rejected
```

### Integrasi AI
- **Penilaian CV**: Layanan AI menilai CV berdasarkan deskripsi pekerjaan (skor 0-100%)
- **Analisis Skill**: Mengembalikan skill yang cocok, skill yang kurang, dan penjelasan
- **Tujuan**: Membantu memprioritaskan kandidat dalam pipeline perekrutan

---

## 3. Model & Tabel Database

### Tabel Users
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `name` | varchar | Wajib |
| `email` | varchar | Unique, wajib |
| `password` | varchar | Hash bcrypt, wajib |
| `role` | enum | `candidate`, `hr`, `hiring_manager`, `admin` |
| `phone` | varchar | Validasi format Indonesia |
| `linkedin` | varchar | Validasi URL |
| `address` | text | - |
| `gender` | varchar | `male`, `female` |
| `photo` | varchar | Nama file |
| `receive_notification` | boolean | Default: `true` |
| `created_at`, `updated_at`, `deleted_at` | timestamp | - |

### Tabel Jobs
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `title` | varchar | Wajib |
| `slug` | varchar | Unique, wajib |
| `department_id` | UUID | Foreign key |
| `location` | varchar | - |
| `employment_type` | enum | `full-time`, `internship`, `contract`, `freelance` |
| `salary_range` | varchar | - |
| `description` | text | Wajib |
| `requirements` | text | - |
| `benefits` | text | - |
| `quantity_needed` | int | Default: `1` |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `status` | enum | `draft`, `pending_approval`, `approved`, `published`, `closed`, `cancelled`, `rejected` |
| `opened_at`, `closed_at` | timestamp | - |
| `created_by_id` | UUID | Foreign key |
| `approved_by_id`, `rejected_by_id` | UUID | Foreign keys |
| `reject_reason` | text | - |
| `file_url` | varchar | URL presigned |
| `created_at`, `updated_at`, `deleted_at` | timestamp | - |
| `application_count` | int | - |

### Tabel Applications
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `job_id` | UUID | Foreign key (indexed) |
| `candidate_id` | UUID | Foreign key (indexed) |
| `cv_filename`, `cv_url` | varchar | URL presigned |
| `ai_score` | int | 0-100 |
| `status` | enum | `applied`, `screening`, `contacted`, `hr_interview`, `hiring_manager_interview`, `salary_negotiation`, `hired`, `rejected` |
| `applied_at` | timestamp | - |
| `visible_in_pipeline` | boolean | Default: `true` |
| `meeting_link` | varchar | Link Teams dari MS Graph |
| `matched_skills`, `missing_skills` | JSONB | - |
| `ai_explanation` | text | - |
| `created_at`, `updated_at` | timestamp | - |

### Tabel Departments
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `name` | varchar | Unique, wajib |
| `created_at`, `updated_at` | timestamp | - |

### Tabel News Culture
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `title`, `slug` | varchar | - |
| `content`, `excerpt` | text | - |
| `image_url`, `gallery_urls` | varchar/JSONB | - |
| `published` | boolean | Default: `false` |
| `published_at` | timestamp | - |
| `created_by_id`, `updated_by_id` | UUID | Foreign keys |
| `created_at`, `updated_at`, `deleted_at` | timestamp | - |

---

## 4. Autentikasi & Otorisasi

### Implementasi JWT
- **Secret**: Environment variable `JWT_SECRET` (minimal 32 karakter)
- **Expiration**: 72 jam
- **Claims**: `user_id`, `email`, `role`
- **Token Format**: Bearer token di header `Authorization`

### Middleware
| Middleware | Tujuan |
|------------|--------|
| `AuthMiddleware` | Validasi JWT dan set context pengguna |
| `AdminOnly` | Batasi akses hanya role admin |
| `HrOnly` | Batasi akses hanya role HR |
| `HiringManagerOnly` | Batasi akses hanya role hiring manager |

### Fitur Keamanan
- Hashing password menggunakan bcrypt
- Validasi nomor telepon kustom (format Indonesia)
- Validasi input dengan go-playground/validator
- CORS diaktifkan untuk semua origin
- Proteksi SQL injection melalui GORM

---

## 5. Operasi & Workflow Utama

### Alur Lamaran Kandidat
1. Publik melamar via `POST /api/v1/jobs/:slug/apply`
2. Sistem validasi input dan upload CV ke MinIO
3. Membuat atau mencari akun kandidat
4. Membuat record lamaran
5. Memanggil layanan AI untuk menilai lamaran
6. Mengirim email notifikasi ke tim HR
7. Mengembalikan detail lamaran dengan skor AI

### Penanganan Upload File
| Tipe | Storage | Validasi |
|------|---------|---------|
| Upload CV | MinIO dengan URL presigned | Sniffing tipe MIME |
| Lampiran Job | MinIO | - |
| Foto Kandidat | MinIO | Sniffing tipe MIME |
| Gambar Berita | MinIO | - |
| Galeri Berita | MinIO | Array JSONB |

### Notifikasi Email
- Alert lamaran baru untuk HR
- Notifikasi update status untuk kandidat
- Penjadwalan wawancara dengan link Teams
- Integrasi Microsoft Graph untuk pembuatan meeting

### Stack Teknologi
| Komponen | Teknologi |
|-----------|-----------|
| Framework | Gin (Go HTTP framework) |
| Database | PostgreSQL dengan GORM |
| Autentikasi | JWT tokens |
| Penyimpanan File | MinIO |
| Layanan AI | Microservice eksternal untuk penilaian CV |
| Email | Integrasi SMTP |
| Meeting | Microsoft Graph API |
| Validasi | Validator kustom + go-playground/validator |

### Fitur Utama
1. **Screening Berbasis AI**: Penilaian CV berdasarkan persyaratan pekerjaan
2. **Akses Berbasis Role**: Pemisahan role yang ketat
3. **Audit Trail**: Semua aksi ditelusuri dengan context pengguna
4. **Soft Delete**: Record ditandai dihapus alih-alih dihapus permanen
5. **Transaksi Aman**: Transaksi database untuk operasi kritis
6. **Optimasi Performa**: Index database untuk query umum

---

## Ringkasan

Sistem rekrutmen ini adalah sistem komprehensif dengan manajemen siklus penuh dari pembuatan lowongan hingga perekrutan kandidat. Fitur utama meliputi:

1. **Multi-role System**: Mendukung Kandidat, HR, Hiring Manager, dan Admin dengan hak akses yang berbeda
2. **Alur Approval**: Lowongan harus disetujui oleh Admin sebelum dipublikasikan
3. **AI-powered Screening**: CV dinilai secara otomatis dengan skor 0-100%
4. **Pipeline Lamaran**: Status lamaran dapat dilacak dari Applied hingga Hired/Rejected
5. **Manajemen File**: CV, foto, dan dokumen lainnya disimpan di MinIO dengan validasi keamanan
6. **Notifikasi**: Email dan integrasi Microsoft Teams untuk koordinasi



  📋 1. Backend Endpoints (API)

  Sistem ini memiliki 40+ endpoint yang dibagi berdasarkan kebutuhan:

  - Endpoints Publik: Tidak butuh login - bisa diakses siapa saja untuk melihat lowongan dan melamar
  - Endpoints Auth: Untuk registrasi dan login pengguna
  - Endpoints Profil: Pengguna bisa mengelola profilnya sendiri
  - Endpoints Admin: Hanya admin yang bisa mengelola user lain
  - Endpoints HR: HR bisa mengelola department, berita, melamaran, dan lowongan
  - Endpoints Hiring Manager: Untuk membuat dan mengelola lowongan kerja
  - Endpoints Kandidat: Kandidat bisa melihat dan mengelola lamaran mereka

  👥 2. Peran Pengguna (Roles)

  Ada 4 jenis peran dengan hak akses berbeda:

  ┌────────────────┬─────────────────────────────────────────────────────────────────────────┐
  │     Peran      │                              Fungsi Utama                               │
  ├────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Kandidat       │ Melamar pekerjaan, lihat status lamaran, edit/tarik lamaran             │
  ├────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ HR             │ Menyaring kandidat, update status lamaran, kelola department dan berita │
  ├────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Hiring Manager │ Membuat lowongan, submit untuk approval, publikasikan lowongan          │
  ├────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Admin          │ Akses penuh, approve/reject lowongan, kelola user                       │
  └────────────────┴─────────────────────────────────────────────────────────────────────────┘

  🔄 3. Alur Kerja Utama

  Alur Lowongan Kerja:
  1. Hiring Manager buat lowongan (Draft)
  2. Kirim untuk persetujuan (Pending Approval)
  3. Admin review → Setujui (Approved) atau Tolak (Rejected)
  4. Jika disetujui, Hiring Manager publikasikan (Published)
  5. Lowongan menerima lamaran hingga ditutup (Closed)

  Alur Lamaran Kandidat:
  Melamar → Screening → Dihubungi → Wawancara HR → Wawancara Hiring Manager
  → Negosiasi Gaji → Diterima (Hired) atau Ditolak (Rejected)

  🗄️ 4. Database (5 Tabel Utama)

  1. Users: Data semua pengguna (kandidat, HR, Hiring Manager, Admin)
  2. Jobs: Semua lowongan kerja dengan status dan approval flow
  3. Applications: Semua lamaran dengan skor AI dan status
  4. Departments: Daftar department perusahaan
  5. News Culture: Artikel berita dan budaya perusahaan

  🔐 5. Keamanan

  - JWT Token: Untuk autentikasi (berlaku 72 jam)
  - Password Hashing: Menggunakan bcrypt
  - Role-based Access: Middleware membatasi akses berdasarkan peran
  - Validasi Input: Mencegah data yang tidak valid
  - MIME Type Sniffing: Validasi keamanan untuk upload file

  🤖 6. Fitur AI

  Sistem terintegrasi dengan layanan AI untuk:
  - Menilai CV: Memberi skor 0-100% berdasarkan kesesuaian dengan deskripsi pekerjaan
  - Analisis Skill: Menampilkan skill yang cocok dan yang kurang
  - Rekomendasi: Membantu HR memprioritaskan kandidat terbaik

  💾 7. Penyimpanan File

  Menggunakan MinIO untuk menyimpan:
  - CV kandidat
  - Foto profil kandidat
  - Lampiran lowongan kerja
  - Gambar berita dan galeri

  📧 8. Notifikasi

  - Email notifikasi saat ada lamaran baru untuk HR
  - Email notifikasi perubahan status untuk kandidat
  - Integrasi Microsoft Graph untuk membuat meeting Teams

  🛠️ 9. Teknologi

  ┌──────────────┬─────────────────────────┐
  │   Komponen   │        Teknologi        │
  ├──────────────┼─────────────────────────┤
  │ Backend      │ Go dengan Gin Framework │
  ├──────────────┼─────────────────────────┤
  │ Database     │ PostgreSQL              │
  ├──────────────┼─────────────────────────┤
  │ ORM          │ GORM                    │
  ├──────────────┼─────────────────────────┤
  │ Autentikasi  │ JWT                     │
  ├──────────────┼─────────────────────────┤
  │ Storage File │ MinIO                   │
  ├──────────────┼─────────────────────────┤
  │ Email        │ SMTP                    │
  ├──────────────┼─────────────────────────┤
  │ Meeting      │ Microsoft Graph API     │
  └──────────────┴─────────────────────────┘

  ✨ 10. Fitur Utama

  1. Multi-role Access Control - Pembagian hak akses yang jelas
  2. AI-powered Screening - Otomatisasi penilaian CV
  3. Soft Delete - Data tidak dihapus permanen, hanya ditandai
  4. Transaction Safety - Transaksi database untuk operasi kritis
  5. Audit Trail - Semua aksi tercatat dengan jejak pengguna

  ---
  Ringkasan: Sistem rekrutmen ini adalah sistem lengkap yang mengelola seluruh proses rekrutmen mulai dari pembuatan lowongan, penerimaan lamaran, screening berbasis AI, hingga proses 
  wawancara dan penawaran kerja. Sistem dirancang dengan keamanan yang baik dan pemisahan peran yang jelas untuk memastikan proses rekrutman berjalan efisien dan transparan.
