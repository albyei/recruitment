# Analisis Kesiapan Deploy Produksi - Wowrack Recruitment Portal

**Tanggal:** 2026-03-29
**Status:** TIDAK SIAP UNTUK PRODUKSI
**Penilai:** Claude Code

---

## Ringkasan Proyek

**Wowrack Recruitment Portal** - Backend API berbasis Go untuk mengelola aplikasi pekerjaan, kandidat, dan alur rekrutmen.

**Tech Stack:**
- Go 1.25.4 (⚠️ Catatan: Menggunakan versi Go yang belum dirilis!)
- Gin web framework
- GORM ORM dengan PostgreSQL
- MinIO/S3 untuk penyimpanan file
- JWT authentication (expiry 72 jam)
- Layanan email SMTP
- Integrasi AI scoring

---

## Ringkasan Arsitektur

```
├── cmd/api/main.go          (Titik masuk aplikasi)
├── internal/
│   ├── config/              (Konfigurasi DB & environment)
│   ├── dto/                 (Data Transfer Objects)
│   ├── handlers/            (HTTP handlers)
│   ├── middleware/          (Auth, CORS, Logger)
│   ├── model/               (Model database)
│   ├── repository/          (Lapisan akses data)
│   ├── service/             (Logika bisnis)
│   ├── util/               (Utilitas: JWT, validasi, pagination)
│   └── pkg/storage/         (Integrasi MinIO)
├── docs/                   (Rencana dan dokumentasi)
└── docker-compose.yml       (Hanya untuk development)
```

---

## Komponen Siap Deploy ✅

| Komponen | Status | Catatan |
|-----------|--------|---------|
| JWT Secret dari Environment | ✅ Diperbaiki | Menggunakan `JWT_SECRET` dari environment, validasi minimum 32 karakter |
| Kredensial Database | ✅ Diperbaiki | Membaca dari env, validasi variabel wajib |
| Secret Endpoint Setup | ✅ Diperbaiki | Menggunakan `SETUP_SECRET` dari environment |
| Validasi File CV | ✅ Diperbaiki | Sniffing tipe MIME, limit 10MB, hanya pdf/doc/docx |
| Validasi File Foto | ✅ Diperbaiki | Sniffing tipe MIME, limit 5MB, hanya jpg/jpeg/png/webp |
| Transaksi Flow Apply | ✅ Diperbaiki | Transaksi atomik untuk pembuatan kandidat + aplikasi + count |
| Pagination | ✅ Diperbaiki | Semua endpoint list mendukung pagination |
| Index Database | ✅ Diperbaiki | Index kritis pada applications, jobs, users |
| Penanganan Error | ✅ Sebagian Diperbaiki | Error kritis sekarang ditangani |

---

## Komponen Siap Sebagian ⚠️

| Komponen | Status | Masalah |
|-----------|--------|----------|
| Deploy Docker | ⚠️ Terbatas | `docker-compose.yml` hanya untuk development, tidak ada config produksi |
| Konfigurasi CORS | ⚠️ Tidak Aman | Wildcard `*` mengizinkan origin apa saja - batasi ke domain spesifik |
| SSL/TLS | ⚠️ Dapat Dikonfigurasi | `DB_SSLMODE` dan `S3_USE_SSL` dapat dinonaktifkan |
| Token JWT | ⚠️ Lama Expiry | Expiry 72 jam tanpa mekanisme refresh token |
| Status Aplikasi | ⚠️ Tanpa Penjaga | Dapat bertransisi dari status apa saja ke status lain (misalnya `hired` → `screening`) |

---

## Komponen Tidak Siap ❌

| Komponen | Status | Masalah |
|-----------|--------|----------|
| Rate Limiting | ❌ Tidak Ada | Tidak ada proteksi terhadap brute force, spam, atau abuse |
| Audit Logging | ❌ Tidak Ada | Tidak ada catatan siapa mengubah apa |
| Monitoring/Metrics | ❌ Tidak Ada | Tidak ada Prometheus, Grafana, atau health endpoints |
| File .env | ❌ Dilacak | Berisi kredensial produksi asli, di-commit ke git |
| Rotasi Kredensial | ❌ Diperlukan | Semua kredensial DB/S3/Email di .env perlu dirotasi |
| Versi Go | ❌ Tidak Valid | `go 1.25.4` tidak ada (versi stabil saat ini 1.22+), build akan gagal |
| Script Build | ❌ Tidak Ada | Tidak ada Makefile, build.sh, atau pipeline CI/CD |
| Strategi Backup | ❌ Tidak Ada | Tidak ada otomatisasi backup database |
| Manajemen Sesi | ❌ Dasar | Tidak ada token revocation, tidak ada refresh tokens |
| Email dalam Plaintext | ❌ Risiko Keamanan | Password dikirim via email ke pengguna baru |
| Health Check Endpoint | ❌ Tidak Ada | Tidak ada endpoint `/health` atau `/ready` untuk load balancers |

---

## Isu Kritis (Blockers)

### 🔴 **SEC-03: .env dengan Kredensial Asli Di-Commit**
**File:** `.env`
**Masalah:** Berisi password database produksi, kunci S3, password SMTP, dan secret JWT.
**Dampak:** Siapa pun dengan akses git dapat mencuri semua kredensial.
**Perbaikan:** Hapus dari git, rotasi semua kredensial, pastikan `.env` ada di `.gitignore`.

### 🔴 **GO-VERSION: Versi Go Tidak Valid**
**File:** `go.mod` (baris 3)
**Masalah:** `go 1.25.4` - Versi ini tidak ada. Stabil saat ini adalah Go 1.23.
**Dampak:** `go mod download` dan `go build` akan gagal.
**Perbaikan:** Ubah ke `go 1.23` atau `go 1.22`.

### 🔴 **SEC-11: Tidak Ada Rate Limiting**
**Files:** Semua endpoint publik (`/login`, `/register`, `/jobs/:slug/apply`)
**Dampak:** Rentan terhadap serangan brute force, credential stuffing, dan abuse.
**Perbaikan:** Implementasikan middleware rate limiting dengan Redis atau in-memory store.

### 🔴 **OPS-01: Tidak Ada Konfigurasi Deploy Produksi**
**Files:** `docker-compose.yml`, direktori root
**Masalah:** Docker compose hanya untuk development. Tidak ada Dockerfile produksi, tidak ada manifest k8s.
**Perbaikan:** Buat Dockerfile siap produksi dengan multi-stage build.

### 🔴 **SEC-09: Password dalam Plaintext di Email**
**Files:** `candidate_application.go:177-187`, `auth_service.go:350-362`
**Dampak:** Password yang dikirim di email dicatat oleh server SMTP, rentan terhadap intersepsi.
**Perbaikan:** Kirim link reset password alih-alih password asli.

### 🔴 **SEC-12: Tidak Ada Penjaga Transisi Pipeline**
**File:** `hr_application.go:UpdateApplicationStatus`
**Masalah:** Aplikasi dapat berpindah dari `hired` ke `rejected` atau `rejected` ke `hired`.
**Dampak:** Masalah integritas data, masalah audit trail.

### 🔴 **MON-01: Tidak Ada Monitoring/Health Checks**
**Files:** `cmd/api/main.go`
**Masalah:** Tidak ada `/health`, `/metrics`, atau logging terstruktur untuk observability.
**Dampak:** Load balancers tidak dapat mendeteksi kegagalan; debugging masalah produksi sulit.

---

## Keputusan Kesiapan Deploy

**TIDAK - Tidak dapat deploy ke produksi.**

### Ringkasan Blockers:
1. **SEC-03** - File `.env` harus dihapus dari git dan kredensial dirotasi
2. **GO-VERSION** - Versi Go tidak valid akan mencegah build
3. **SEC-11** - Tidak ada rate limiting pada endpoint auth
4. **OPS-01** - Tidak ada konfigurasi deploy produksi
5. **SEC-09** - Password dikirim dalam plaintext via email
6. **MON-01** - Tidak ada health checks untuk load balancers

---

## Checklist Pra-Deploy

### Harus Selesai Sebelum Deploy:

#### Keamanan 🔴
- [ ] Hapus `.env` dari tracking git
- [ ] Rotasi DB_PASSWORD (`albiadmin123@`)
- [ ] Rotasi S3_ACCESS_KEY/S3_SECRET_KEY (`albiadmingamtenk`/`albiarizasyafiq987654321`)
- [ ] Rotasi JWT_SECRET (`rahasia-sangat-rahasia-wowrack-2025-min-32-char`)
- [ ] Rotasi EMAIL_PASSWORD (`wefsqjbxpiyvbkyq`)
- [ ] Perbaiki versi Go ke `go 1.23`
- [ ] Implementasikan rate limiting pada `/login`, `/register`, `/apply`
- [ ] Ganti email password plaintext dengan link reset
- [ ] Tambahkan penjaga transisi status aplikasi
- [ ] Batasi CORS dari `*` ke domain spesifik

#### Operasional 🟠
- [ ] Buat `Dockerfile` produksi (multi-stage build)
- [ ] Tambahkan endpoint `/health` dan `/ready`
- [ ] Implementasikan logging terstruktur dengan correlation IDs
- [ ] Konfigurasi kumpulan log (Loki/ELK)
- [ ] Konfigurasi database connection pooling
- [ ] Konfigurasi otomatisasi backup database
- [ ] Buat prosedur rollback

#### Infrastruktur 🟡
- [ ] Konfigurasi pipeline CI/CD
- [ ] Konfigurasi health check load balancer
- [ ] Konfigurasi monitoring (Prometheus/Grafana atau cloud-native)
- [ ] Konfigurasi sertifikat SSL untuk domain
- [ ] Konfigurasi manajemen secrets (HashiCorp Vault/AWS Secrets Manager)

#### Pengujian 🟢
- [ ] Jalankan semua unit test: `go test ./...`
- [ ] Integration tests dengan database staging
- [ ] Load testing untuk flow pengajuan aplikasi
- [ ] Security scanning: `gosec ./...`
- [ ] Dependency scanning: `go mod verify`

---

## Rekomendasi

### Segera (Sebelum Deploy Apapun):
1. **Perbaiki versi Go** - Ubah `go 1.25.4` ke `go 1.23` di `go.mod`
2. **Amankan kredensial** - Hapus `.env` dari git, rotasi SEMUA kredensial
3. **Tambahkan health endpoint** - Diperlukan untuk health check load balancer

### Jangka Pendek (Dalam Sprint):
4. **Rate limiting** - Cegah abuse pada endpoint autentikasi
5. **Flow reset password** - Jangan kirim password plaintext
6. **Dockerfile produksi** - Aktifkan deployment container
7. **Audit logging** - Lacak siapa mengubah apa

### Jangka Panjang (Produksi Grade):
8. **Sistem token refresh** - Ganti token 72h tunggal dengan pola access+refresh
9. **Stack observability** - Prometheus, Grafana, Loki
10. **Feature flags** - Gradual rollout dengan Redis/Unleash
11. **Circuit breakers** - Lindung terhadap kegagalan cascade

---

## Detail Isu yang Perlu Perbaikan

### 1. Invalid Go Version
**File:** `go.mod:3`
```go
go 1.25.4  // ❌ Versi ini tidak ada!
```
**Perbaikan:**
```go
go 1.23  // ✅ Gunakan versi stabil terbaru
```

### 2. CORS Wildcard
**File:** `internal/middleware/cors.go:7`
```go
c.Header("Access-Control-Allow-Origin", "*")  // ❌ Tidak aman
```
**Perbaikan:**
```go
allowedOrigins := map[string]bool{
    "https://recruitment.wowrack.com": true,
    "http://localhost:3000":           true, // dev only
}
origin := c.GetHeader("Origin")
if allowedOrigins[origin] {
    c.Header("Access-Control-Allow-Origin", origin)
    c.Header("Vary", "Origin")
}
```

### 3. Password di Email
**File:** `internal/service/application/candidate_application.go:176-191`
**Saat ini (❌):**
```go
body := fmt.Sprintf(`
    <li>Password: <strong>%s</strong></li>
`, newCandidatePassword)
util.SendEmail(req.Email, "Lamaran Diterima - Wowrack", body)
```
**Perbaikan (✅):**
```go
// 1. Generate reset token
resetToken := uuid.New().String()
resetTokenHash := sha256.Sum256([]byte(resetToken))

// 2. Simpan hash di DB dengan expiry
db.Create(&model.PasswordReset{
    UserID:  candidate.ID,
    TokenHash: hex.EncodeToString(resetTokenHash),
    ExpiresAt: time.Now().Add(24 * time.Hour),
})

// 3. Kirim link reset
resetLink := fmt.Sprintf("https://recruitment.wowrack.com/set-password?token=%s", resetToken)
body := fmt.Sprintf(`
    <p>Klik link berikut untuk mengatur password Anda:</p>
    <a href="%s">%s</a>
`, resetLink, resetLink)
util.SendEmail(req.Email, "Set Password Akun Wowrack", body)
```

### 4. Guard Transisi Status
**File:** `internal/model/application.go`
**Tambahkan:**
```go
var ValidTransitions = map[ApplicationStatus][]ApplicationStatus{
    AppApplied:                {AppScreening, AppRejected},
    AppScreening:              {AppContacted, AppRejected},
    AppContacted:              {AppHRInterview, AppRejected},
    AppHRInterview:            {AppHiringManagerInterview, AppRejected},
    AppHiringManagerInterview: {AppSalaryNegotiation, AppRejected},
    AppSalaryNegotiation:      {AppHired, AppRejected},
    // Terminal states: AppHired, AppRejected — tidak ada transisi keluar
}

func IsValidTransition(from, to ApplicationStatus) bool {
    allowed, exists := ValidTransitions[from]
    if !exists {
        return false
    }
    for _, s := range allowed {
        if s == to {
            return true
        }
    }
    return false
}
```

---

## Prioritas Perbaikan

### Prioritas 1 - Blok Build (HARI INI):
1. ✅ Fix versi Go di `go.mod`
2. ✅ Hapus `.env` dari git
3. ✅ Rotasi semua kredensial

### Prioritas 2 - Keamanan Kritis (MINGGU INI):
4. Rate limiting pada endpoint auth
5. CORS domain-specific
6. Health endpoint untuk LB

### Prioritas 3 - Operasional (BULAN INI):
7. Dockerfile produksi
8. Audit logging
9. Monitoring setup

### Prioritas 4 - Peningkatan (TRIWULAN):
10. Token refresh system
11. Reset password flow
12. Circuit breakers
