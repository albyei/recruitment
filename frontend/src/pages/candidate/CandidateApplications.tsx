import { useState, useMemo } from 'react';
import { mockCandidateApplications } from '@/lib/mockCandidateData';
import { useSurveys } from '@/lib/surveyStore';
import SurveyDialog from '@/components/candidate/SurveyDialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Video, Search, ArrowUpDown, ClipboardList, CheckCircle } from 'lucide-react';

type SortField = 'position' | 'appliedDate' | 'currentStage';
type SortOrder = 'asc' | 'desc';

export default function CandidateApplications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('appliedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [surveyApp, setSurveyApp] = useState<{ id: string; position: string; department: string; stage: 'Hired' | 'Rejected' } | null>(null);
  const { addSurvey, hasSubmittedSurvey } = useSurveys();
  const { toast } = useToast();

  const isSurveyStage = (stage: string) => stage === 'Hired' || stage === 'Rejected';

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Hired':
        return 'bg-green-500/10 text-green-600';
      case 'Rejected':
        return 'bg-destructive/10 text-destructive';
      case 'Interview':
      case 'User Interview':
      case 'Salary Negotiation':
        return 'bg-blue-500/10 text-blue-600';
      default:
        return 'bg-amber-500/10 text-amber-600';
    }
  };

  const isInterviewStage = (stage: string) => {
    return stage === 'Interview' || stage === 'User Interview';
  };

  const handleJoinInterview = (applicationId: string) => {
    // Mock join interview action
    window.open(`https://meet.example.com/interview/${applicationId}`, '_blank');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedApplications = useMemo(() => {
    let result = [...mockCandidateApplications];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.position.toLowerCase().includes(query) ||
          app.department.toLowerCase().includes(query)
      );
    }

    // Filter by stage
    if (stageFilter !== 'all') {
      result = result.filter((app) => app.currentStage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'appliedDate':
          comparison = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
          break;
        case 'currentStage':
          comparison = a.currentStage.localeCompare(b.currentStage);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, stageFilter, sortField, sortOrder]);

  const uniqueStages = [...new Set(mockCandidateApplications.map((app) => app.currentStage))];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground mt-1">View all your job applications</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by position or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {uniqueStages.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-') as [SortField, SortOrder];
          setSortField(field);
          setSortOrder(order);
        }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appliedDate-desc">Latest Applied</SelectItem>
            <SelectItem value="appliedDate-asc">Oldest Applied</SelectItem>
            <SelectItem value="position-asc">Position A-Z</SelectItem>
            <SelectItem value="position-desc">Position Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredAndSortedApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('position')}
                    >
                      Position
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('appliedDate')}
                    >
                      Applied Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('currentStage')}
                    >
                      Current Stage
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Next Step</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.position}</p>
                        <p className="text-sm text-muted-foreground">{app.department}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(app.appliedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStageColor(
                          app.currentStage
                        )}`}
                      >
                        {app.currentStage}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      {app.nextStep}
                    </TableCell>
                    <TableCell>
                      {isInterviewStage(app.currentStage) && (
                        <Button
                          size="sm"
                          onClick={() => handleJoinInterview(app.id)}
                          className="gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Join
                        </Button>
                      )}
                      {isSurveyStage(app.currentStage) && (
                        hasSubmittedSurvey(app.id) ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="h-3.5 w-3.5" /> Submitted
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSurveyApp({ id: app.id, position: app.position, department: app.department, stage: app.currentStage as 'Hired' | 'Rejected' })}
                            className="gap-2"
                          >
                            <ClipboardList className="h-4 w-4" />
                            Survey
                          </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No applications found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {surveyApp && (
        <SurveyDialog
          open={!!surveyApp}
          onOpenChange={(open) => !open && setSurveyApp(null)}
          applicationId={surveyApp.id}
          position={surveyApp.position}
          department={surveyApp.department}
          stage={surveyApp.stage}
          onSubmit={(data) => {
            addSurvey(data);
            toast({ title: 'Survey Submitted', description: 'Thank you for your feedback!' });
          }}
        />
      )}
    </div>
  );
}
