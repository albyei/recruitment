import { useState, useMemo } from 'react';
import { jobs as initialJobs, departments, locations, jobTypes, Job } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Briefcase, MapPin, DollarSign, Search, Filter, CalendarDays, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function HRJobOpenings() {
  const [jobList, setJobList] = useState<Job[]>(initialJobs);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Dialog states
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);

  // Form state for create/edit
  const emptyForm: Omit<Job, 'id'> = {
    title: '', department: '', location: '', type: '', salary: '',
    postedDate: new Date().toISOString().split('T')[0],
    description: '', responsibilities: [], requirements: [], benefits: [],
  };
  const [formData, setFormData] = useState<Omit<Job, 'id'>>(emptyForm);
  const [formResponsibilities, setFormResponsibilities] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formBenefits, setFormBenefits] = useState('');

  const filtered = useMemo(() => {
    return jobList.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.department.toLowerCase().includes(search.toLowerCase());
      const matchesDept = departmentFilter === 'all' || job.department === departmentFilter;
      const matchesLoc = locationFilter === 'all' || job.location === locationFilter;
      const matchesType = typeFilter === 'all' || job.type === typeFilter;
      return matchesSearch && matchesDept && matchesLoc && matchesType;
    });
  }, [search, departmentFilter, locationFilter, typeFilter, jobList]);

  const clearFilters = () => {
    setSearch('');
    setDepartmentFilter('all');
    setLocationFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = search || departmentFilter !== 'all' || locationFilter !== 'all' || typeFilter !== 'all';

  const openCreate = () => {
    setFormData(emptyForm);
    setFormResponsibilities('');
    setFormRequirements('');
    setFormBenefits('');
    setIsCreateOpen(true);
  };

  const openEdit = (job: Job) => {
    setFormData({ ...job });
    setFormResponsibilities(job.responsibilities.join('\n'));
    setFormRequirements(job.requirements.join('\n'));
    setFormBenefits(job.benefits.join('\n'));
    setEditJob(job);
  };

  const handleSave = () => {
    if (!formData.title || !formData.department || !formData.location || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }
    const jobData: Job = {
      ...formData,
      id: editJob ? editJob.id : `job-${Date.now()}`,
      responsibilities: formResponsibilities.split('\n').filter(Boolean),
      requirements: formRequirements.split('\n').filter(Boolean),
      benefits: formBenefits.split('\n').filter(Boolean),
    };

    if (editJob) {
      setJobList(prev => prev.map(j => j.id === editJob.id ? jobData : j));
      toast.success('Job opening updated successfully');
      setEditJob(null);
    } else {
      setJobList(prev => [jobData, ...prev]);
      toast.success('Job opening created successfully');
      setIsCreateOpen(false);
    }
  };

  const handleDelete = () => {
    if (deleteJob) {
      setJobList(prev => prev.filter(j => j.id !== deleteJob.id));
      toast.success('Job opening deleted');
      setDeleteJob(null);
    }
  };

  const isFormOpen = isCreateOpen || !!editJob;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Job Openings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and monitor all active job postings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filtered.length} of {jobList.length} openings
          </Badge>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm" className="shrink-0">
                <Filter className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No job openings found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <Badge variant="outline">{job.type}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {job.salary}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(job.postedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{job.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setViewJob(job)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(job)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteJob(job)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewJob} onOpenChange={() => setViewJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewJob?.title}</DialogTitle>
            <DialogDescription>{viewJob?.department} • {viewJob?.location} • {viewJob?.type}</DialogDescription>
          </DialogHeader>
          {viewJob && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Salary</p>
                <p className="text-sm text-muted-foreground">{viewJob.salary}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{viewJob.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Responsibilities</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {viewJob.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Requirements</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {viewJob.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Benefits</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {viewJob.benefits.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={() => { setIsCreateOpen(false); setEditJob(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editJob ? 'Edit Job Opening' : 'Create Job Opening'}</DialogTitle>
            <DialogDescription>Fill in the job details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Salary Range</Label>
                <Input value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="e.g. Rp 20.000.000 - Rp 30.000.000" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={formData.department} onValueChange={v => setFormData({...formData, department: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select value={formData.location} onValueChange={v => setFormData({...formData, location: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {jobTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Responsibilities (one per line)</Label>
              <Textarea value={formResponsibilities} onChange={e => setFormResponsibilities(e.target.value)} rows={4} placeholder="Enter each responsibility on a new line" />
            </div>
            <div className="space-y-2">
              <Label>Requirements (one per line)</Label>
              <Textarea value={formRequirements} onChange={e => setFormRequirements(e.target.value)} rows={4} placeholder="Enter each requirement on a new line" />
            </div>
            <div className="space-y-2">
              <Label>Benefits (one per line)</Label>
              <Textarea value={formBenefits} onChange={e => setFormBenefits(e.target.value)} rows={4} placeholder="Enter each benefit on a new line" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditJob(null); }}>Cancel</Button>
            <Button onClick={handleSave}>{editJob ? 'Save Changes' : 'Create Job'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteJob} onOpenChange={() => setDeleteJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Opening</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteJob?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteJob(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
