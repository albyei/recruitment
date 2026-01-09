import { useState } from 'react';
import { 
  User, 
  GripVertical,
  Star,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { mockCandidates, Candidate, PipelineStage, pipelineStages } from '@/lib/mockHRData';

export default function HRPipeline() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [rejectCandidate, setRejectCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();

  const getCandidatesByStage = (stage: PipelineStage) => {
    const stageCandidates = candidates.filter(c => c.stage === stage);
    // Sort by AI score for 'applied' stage
    if (stage === 'applied') {
      return stageCandidates.sort((a, b) => b.aiScore - a.aiScore);
    }
    return stageCandidates;
  };

  const moveCandidate = (candidateId: string, newStage: PipelineStage) => {
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

  const getNextStage = (currentStage: PipelineStage): PipelineStage | null => {
    const currentIndex = pipelineStages.findIndex(s => s.key === currentStage);
    if (currentIndex < pipelineStages.length - 2) { // -2 to skip 'rejected'
      return pipelineStages[currentIndex + 1].key;
    }
    return null;
  };

  const getPreviousStage = (currentStage: PipelineStage): PipelineStage | null => {
    const currentIndex = pipelineStages.findIndex(s => s.key === currentStage);
    if (currentIndex > 0) {
      return pipelineStages[currentIndex - 1].key;
    }
    return null;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Hiring Pipeline</h1>
          <p className="text-muted-foreground mt-1">Kanban view of all candidates</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total: {candidates.length} candidates</span>
        </div>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 min-w-max">
          {pipelineStages.map((stage) => {
            const stageCandidates = getCandidatesByStage(stage.key);
            return (
              <div 
                key={stage.key} 
                className="w-80 flex-shrink-0"
              >
                <Card className="h-full">
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
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-3 pr-4">
                        {stageCandidates.map((candidate) => (
                          <Card 
                            key={candidate.id} 
                            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
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
                                    <DropdownMenuItem>
                                      <Mail className="h-4 w-4 mr-2" />
                                      Send Email
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

                              <div className="ml-6">
                                <p className="font-medium text-sm">{candidate.name}</p>
                                <p className="text-xs text-muted-foreground">{candidate.position}</p>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500" />
                                    <span className="text-xs font-medium">{candidate.aiScore}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {candidate.experience}y exp
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                  {candidate.skills.slice(0, 2).map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>

                                <p className="text-[10px] text-muted-foreground mt-2">
                                  Applied: {candidate.appliedDate}
                                </p>
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
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

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
    </div>
  );
}
