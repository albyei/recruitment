import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  User, 
  GripVertical,
  Star,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Filter,
  Search,
  X,
  Settings2,
  GraduationCap,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { mockCandidates, Candidate, PipelineStage } from '@/lib/mockHRData';
import { usePipelineStages } from '@/lib/pipelineStageStore';
import StageEditorDialog from '@/components/hr/StageEditorDialog';
import RejectionEmailDialog from '@/components/hr/RejectionEmailDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface JobOpening {
  position: string;
  department: string;
  candidateCount: number;
}

export default function HRPipeline() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [rejectCandidate, setRejectCandidate] = useState<Candidate | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [universityFilter, setUniversityFilter] = useState<string>('all');
  const [lastRoleFilter, setLastRoleFilter] = useState<string>('all');
  const [stageEditorOpen, setStageEditorOpen] = useState(false);
  const [highlightedCandidateId, setHighlightedCandidateId] = useState<string | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();
  const pipelineStages = usePipelineStages();

  // Auto-select job and candidate from URL params
  useEffect(() => {
    const jobParam = searchParams.get('job');
    const candidateParam = searchParams.get('candidate');
    if (jobParam) {
      setSelectedJob(jobParam);
    }
    if (candidateParam) {
      setHighlightedCandidateId(candidateParam);
    }
    if (jobParam || candidateParam) {
      searchParams.delete('job');
      searchParams.delete('candidate');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to and highlight candidate after render
  useEffect(() => {
    if (highlightedCandidateId && selectedJob) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`candidate-card-${highlightedCandidateId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          // Remove highlight after animation
          setTimeout(() => setHighlightedCandidateId(null), 1500);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightedCandidateId, selectedJob]);

  // Derive unique job openings from candidates
  const jobOpenings = useMemo<JobOpening[]>(() => {
    const jobMap = new Map<string, JobOpening>();
    candidates.forEach((c) => {
      if (!jobMap.has(c.position)) {
        jobMap.set(c.position, { position: c.position, department: c.department, candidateCount: 0 });
      }
      jobMap.get(c.position)!.candidateCount++;
    });
    return Array.from(jobMap.values());
  }, [candidates]);

  // Unique sources for filter
  const sources = useMemo(() => {
    const s = new Set(candidates.map((c) => c.source));
    return Array.from(s);
  }, [candidates]);

  // Unique universities for filter
  const universities = useMemo(() => {
    const u = new Set(candidates.filter(c => c.universityName).map(c => c.universityName!));
    return Array.from(u).sort();
  }, [candidates]);

  // Unique last roles for filter
  const lastRoles = useMemo(() => {
    const r = new Set(candidates.map(c => c.lastRole));
    return Array.from(r).sort();
  }, [candidates]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    if (!selectedJob) return [];
    let result = candidates.filter((c) => c.position === selectedJob);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (sourceFilter !== 'all') {
      result = result.filter((c) => c.source === sourceFilter);
    }
    if (scoreFilter === 'high') {
      result = result.filter((c) => c.aiScore >= 85);
    } else if (scoreFilter === 'medium') {
      result = result.filter((c) => c.aiScore >= 70 && c.aiScore < 85);
    } else if (scoreFilter === 'low') {
      result = result.filter((c) => c.aiScore < 70);
    }
    if (universityFilter !== 'all') {
      result = result.filter((c) => c.universityName === universityFilter);
    }
    if (lastRoleFilter !== 'all') {
      result = result.filter((c) => c.lastRole === lastRoleFilter);
    }
    return result;
  }, [selectedJob, candidates, searchQuery, sourceFilter, scoreFilter, universityFilter, lastRoleFilter]);

  const candidateCountByStage = useMemo(() => {
    const counts: Record<string, number> = {};
    const jobCandidates = selectedJob ? candidates.filter(c => c.position === selectedJob) : candidates;
    jobCandidates.forEach((c) => { counts[c.stage] = (counts[c.stage] || 0) + 1; });
    return counts;
  }, [candidates, selectedJob]);

  const getCandidatesByStage = (stage: string) => {
    const stageCandidates = filteredCandidates.filter(c => c.stage === stage);
    if (stage === 'applied') {
      return stageCandidates.sort((a, b) => b.aiScore - a.aiScore);
    }
    return stageCandidates;
  };

  const moveCandidate = (candidateId: string, newStage: string) => {
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, stage: newStage } : c
    ));

    const candidate = candidates.find(c => c.id === candidateId);
    const stageInfo = pipelineStages.find(s => s.key === newStage);

    if (newStage === 'rejected') {
      toast({
        title: 'Candidate Rejected',
        description: `Auto-rejection email sent to ${candidate?.name}`,
      });
    } else {
      toast({
        title: 'Candidate Moved',
        description: `${candidate?.name} moved to ${stageInfo?.label}`,
      });
    }
  };

  const handleReject = () => {
    if (rejectCandidate) {
      moveCandidate(rejectCandidate.id, 'rejected');
      setRejectCandidate(null);
    }
  };

  const handleStagesSaved = (removedKeys: string[]) => {
    if (removedKeys.length > 0) {
      setCandidates(prev => prev.map(c =>
        removedKeys.includes(c.stage) ? { ...c, stage: 'applied' as PipelineStage } : c
      ));
      const count = candidates.filter(c => removedKeys.includes(c.stage)).length;
      if (count > 0) {
        toast({
          title: 'Candidates Moved',
          description: `${count} candidate${count !== 1 ? 's' : ''} from deleted stage${removedKeys.length !== 1 ? 's' : ''} moved to Applied.`,
        });
      }
    }
  };

  const getNextStage = (currentStage: string): string | null => {
    const currentIndex = pipelineStages.findIndex(s => s.key === currentStage);
    if (currentIndex < pipelineStages.length - 2) {
      return pipelineStages[currentIndex + 1].key;
    }
    return null;
  };

  const getPreviousStage = (currentStage: string): string | null => {
    const currentIndex = pipelineStages.findIndex(s => s.key === currentStage);
    if (currentIndex > 0) {
      return pipelineStages[currentIndex - 1].key;
    }
    return null;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setScoreFilter('all');
    setUniversityFilter('all');
    setLastRoleFilter('all');
  };

  const hasActiveFilters = searchQuery || sourceFilter !== 'all' || scoreFilter !== 'all' || universityFilter !== 'all' || lastRoleFilter !== 'all';

  // Job selection view
  if (!selectedJob) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Hiring Pipeline</h1>
          <p className="text-muted-foreground mt-1">Select a job opening to view its candidate pipeline</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobOpenings.map((job) => (
            <Card
              key={job.position}
              className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => setSelectedJob(job.position)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{job.position}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.department}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {job.candidateCount} candidate{job.candidateCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Pipeline view for selected job
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedJob(null); clearFilters(); }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{selectedJob}</h1>
            <p className="text-muted-foreground mt-1">
              {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} in pipeline
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setStageEditorOpen(true)}>
          <Settings2 className="h-4 w-4 mr-1" /> Customize Stages
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue placeholder="AI Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="high">High (85+)</SelectItem>
                  <SelectItem value="medium">Medium (70-84)</SelectItem>
                  <SelectItem value="low">Low (&lt;70)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={universityFilter} onValueChange={setUniversityFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9">
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={lastRoleFilter} onValueChange={setLastRoleFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9">
                  <SelectValue placeholder="Previous Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {lastRoles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {pipelineStages.map((stage) => {
            const stageCandidates = getCandidatesByStage(stage.key);
            return (
              <div key={stage.key} className="w-80 flex-shrink-0">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                        {stage.label}
                      </CardTitle>
                      <Badge variant="secondary">{stageCandidates.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                        {stageCandidates.map((candidate) => (
                          <Card 
                            key={candidate.id}
                            id={`candidate-card-${candidate.id}`}
                            className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-500 ${
                              highlightedCandidateId === candidate.id
                                ? 'ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5'
                                : ''
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">
                                      {candidate.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {getPreviousStage(candidate.stage) && (
                                      <DropdownMenuItem onClick={() => moveCandidate(candidate.id, getPreviousStage(candidate.stage)!)}>
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Move to {pipelineStages.find(s => s.key === getPreviousStage(candidate.stage))?.label}
                                      </DropdownMenuItem>
                                    )}
                                    {getNextStage(candidate.stage) && (
                                      <DropdownMenuItem onClick={() => moveCandidate(candidate.id, getNextStage(candidate.stage)!)}>
                                        <ChevronRight className="h-4 w-4 mr-2" />
                                        Move to {pipelineStages.find(s => s.key === getNextStage(candidate.stage))?.label}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => setEmailCandidate(candidate)}>
                                      <Mail className="h-4 w-4 mr-2" />
                                      Send Rejection Email
                                    </DropdownMenuItem>
                                    {candidate.stage !== 'rejected' && candidate.stage !== 'hired' && (
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => setRejectCandidate(candidate)}
                                      >
                                        Reject Candidate
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="ml-6 space-y-1.5">
                                <p className="font-medium text-sm">{candidate.name}</p>
                                <p className="text-xs text-muted-foreground">{candidate.source}</p>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500" />
                                    <span className="text-xs font-medium">{candidate.aiScore}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {candidate.experience}y exp
                                  </span>
                                </div>

                                {/* Last Position & Company */}
                                {candidate.lastRole && (
                                  <div className="flex items-start gap-1.5 mt-1.5">
                                    <Building2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                    <span className="text-xs text-muted-foreground leading-tight">
                                      {candidate.lastRole} at {candidate.lastCompany}
                                    </span>
                                  </div>
                                )}

                                {/* Education */}
                                <div className="flex items-start gap-1.5">
                                  <GraduationCap className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                  <span className="text-xs text-muted-foreground leading-tight">
                                    {candidate.educationType === 'university'
                                      ? `${candidate.universityLevel || ''} — ${candidate.universityName || 'University'}`
                                      : candidate.highSchoolName || 'High School'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {candidate.skills.slice(0, 2).map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-[10px] text-muted-foreground">
                                    Applied: {candidate.appliedDate}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/hr/candidates?open=${candidate.id}`);
                                    }}
                                    title="View candidate details"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Detail
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {stageCandidates.length === 0 && (
                          <div className="py-8 text-center text-muted-foreground">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No candidates</p>
                          </div>
                        )}
                      </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection Confirmation Dialog */}
      <AlertDialog open={!!rejectCandidate} onOpenChange={() => setRejectCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {rejectCandidate?.name}? 
              An automatic rejection email will be sent to the candidate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
              Reject & Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StageEditorDialog
        open={stageEditorOpen}
        onOpenChange={setStageEditorOpen}
        currentStages={pipelineStages}
        candidateCountByStage={candidateCountByStage}
        onStagesSaved={handleStagesSaved}
      />

      <RejectionEmailDialog
        open={!!emailCandidate}
        onOpenChange={(open) => { if (!open) setEmailCandidate(null); }}
        candidate={emailCandidate}
        onSend={() => {
          toast({
            title: 'Rejection Email Sent',
            description: `Rejection email sent to ${emailCandidate?.name}`,
          });
          if (emailCandidate) {
            moveCandidate(emailCandidate.id, 'rejected');
          }
          setEmailCandidate(null);
        }}
      />
    </div>
  );
}
