import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { jobs } from "@/lib/mockData";
import { universities as universityList } from "@/lib/universityData";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  province_id: string;
  name: string;
}


export default function QuickApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = jobs.find((j) => j.id === id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    provinceId: "",
    regencyId: "",
    linkedIn: "",
    coverLetter: "",
    lastRole: "",
    lastCompany: "",
    lastWorkFrom: "",
    lastWorkTo: "",
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Education state
  const [educationType, setEducationType] = useState<"highschool" | "university">("highschool");
  const [highSchoolName, setHighSchoolName] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [filteredUniversities, setFilteredUniversities] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [universityLevel, setUniversityLevel] = useState("");
  const universityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch(() => toast.error("Gagal memuat data provinsi"));
  }, []);

  useEffect(() => {
    if (formData.provinceId) {
      setRegencies([]);
      setFormData((prev) => ({ ...prev, regencyId: "" }));
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.provinceId}.json`)
        .then((res) => res.json())
        .then((data) => setRegencies(data))
        .catch(() => toast.error("Gagal memuat data kota/kabupaten"));
    }
  }, [formData.provinceId]);

  useEffect(() => {
    if (universitySearch.length < 2) {
      setFilteredUniversities([]);
      setShowUniversityDropdown(false);
      return;
    }
    const query = universitySearch.toLowerCase();
    const results = universityList.filter((u) => u.toLowerCase().includes(query)).slice(0, 20);
    setFilteredUniversities(results);
    setShowUniversityDropdown(results.length > 0);
  }, [universitySearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (universityRef.current && !universityRef.current.contains(e.target as Node)) {
        setShowUniversityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job not found</h1>
          <Button asChild>
            <Link to="/careers">Back to Careers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call and AI scoring
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("Application submitted successfully!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setCvFile(file);
      } else {
        toast.error("Please upload a PDF or DOCX file");
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center shadow-lg"
        >
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for applying to {job.title}. We've sent a confirmation email with your login credentials to access the candidate portal.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-2">Your application is being reviewed by our AI system. Typical response time:</p>
            <p className="font-medium text-foreground">2-3 business days</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/candidate">Go to Candidate Portal</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/careers">Browse More Jobs</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="gradient-hero py-8">
        <div className="container">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to job details
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            Apply for {job.title}
          </h1>
          <p className="text-primary-foreground/80 mt-2">
            {job.department} • {job.location}
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="container max-w-2xl">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-card space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+62 8123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                <Input
                  id="linkedIn"
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Provinsi *</Label>
                <Select
                  value={formData.provinceId}
                  onValueChange={(value) => setFormData({ ...formData, provinceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kota/Kabupaten *</Label>
                <Select
                  value={formData.regencyId}
                  onValueChange={(value) => setFormData({ ...formData, regencyId: value })}
                  disabled={!formData.provinceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kota/Kabupaten" />
                  </SelectTrigger>
                  <SelectContent>
                    {regencies.map((reg) => (
                      <SelectItem key={reg.id} value={reg.id}>
                        {reg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pengalaman Kerja Terakhir *</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastRole" className="text-xs text-muted-foreground">Posisi/Role</Label>
                  <Input
                    id="lastRole"
                    required
                    value={formData.lastRole}
                    onChange={(e) => setFormData({ ...formData, lastRole: e.target.value })}
                    placeholder="Frontend Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastCompany" className="text-xs text-muted-foreground">Perusahaan</Label>
                  <Input
                    id="lastCompany"
                    required
                    value={formData.lastCompany}
                    onChange={(e) => setFormData({ ...formData, lastCompany: e.target.value })}
                    placeholder="PT Contoh Indonesia"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastWorkFrom" className="text-xs text-muted-foreground">Dari</Label>
                  <Input
                    id="lastWorkFrom"
                    type="month"
                    required
                    value={formData.lastWorkFrom}
                    onChange={(e) => setFormData({ ...formData, lastWorkFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastWorkTo" className="text-xs text-muted-foreground">Sampai</Label>
                  <Input
                    id="lastWorkTo"
                    type="month"
                    required
                    value={formData.lastWorkTo}
                    onChange={(e) => setFormData({ ...formData, lastWorkTo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-3">
              <Label>Pendidikan Terakhir *</Label>
              <RadioGroup
                value={educationType}
                onValueChange={(val) => {
                  setEducationType(val as "highschool" | "university");
                  setHighSchoolName("");
                  setSelectedUniversity("");
                  setUniversitySearch("");
                  setUniversityLevel("");
                }}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="highschool" id="edu-highschool" />
                  <Label htmlFor="edu-highschool" className="font-normal cursor-pointer">SMA/SMK (High School / Vocational)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="university" id="edu-university" />
                  <Label htmlFor="edu-university" className="font-normal cursor-pointer">Universitas / Politeknik</Label>
                </div>
              </RadioGroup>

              {educationType === "highschool" ? (
                <Input
                  required
                  value={highSchoolName}
                  onChange={(e) => setHighSchoolName(e.target.value)}
                  placeholder="Nama SMA/SMK"
                />
              ) : (
                <div className="space-y-3">
                  <Select value={universityLevel} onValueChange={setUniversityLevel} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenjang Pendidikan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="D3">D3 – Diploma 3</SelectItem>
                      <SelectItem value="D4">D4 – Diploma 4 / Sarjana Terapan</SelectItem>
                      <SelectItem value="S1">S1 – Sarjana (Undergraduate)</SelectItem>
                      <SelectItem value="S2">S2 – Magister (Master)</SelectItem>
                      <SelectItem value="S3">S3 – Doktor (Doctorate)</SelectItem>
                      <SelectItem value="Other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative" ref={universityRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        required={educationType === "university"}
                        value={universitySearch}
                        onChange={(e) => {
                          setUniversitySearch(e.target.value);
                          setSelectedUniversity("");
                        }}
                        placeholder="Cari nama universitas..."
                        className="pl-9"
                      />
                    </div>
                    {selectedUniversity && (
                      <p className="text-xs text-muted-foreground mt-1">Dipilih: <span className="text-foreground font-medium">{selectedUniversity}</span></p>
                    )}
                    {showUniversityDropdown && filteredUniversities.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                        {filteredUniversities.map((uni, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => {
                              setSelectedUniversity(uni);
                              setUniversitySearch(uni);
                              setShowUniversityDropdown(false);
                            }}
                          >
                            <span className="font-medium">{uni}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv">Resume/CV * (PDF or DOCX)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-secondary/50 transition-colors">
                <input
                  id="cv"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label htmlFor="cv" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  {cvFile ? (
                    <p className="text-sm font-medium text-foreground">{cvFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PDF or DOCX (max 5MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                placeholder="Tell us why you're interested in this role..."
                rows={5}
              />
            </div>

            <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreementTerms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="agreementTerms" className="text-sm text-foreground cursor-pointer">
                  I agree to the{" "}
                  <Link to="/privacy" className="text-secondary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                  ,{" "}
                  <Link to="/terms" className="text-secondary hover:underline font-medium">
                    Terms and Conditions
                  </Link>
                  , authorize background checks and employment verification, and confirm that all information provided is accurate and complete.
                </label>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || !agreedToTerms}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
