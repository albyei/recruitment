import { useState, useMemo } from 'react';
import { mockCandidateApplications } from '@/lib/mockCandidateData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Video, Search, ArrowUpDown } from 'lucide-react';

type SortField = 'position' | 'appliedDate' | 'aiScore' | 'currentStage';
type SortOrder = 'asc' | 'desc';

export default function CandidateApplications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('appliedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-destructive';
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
        case 'aiScore':
          comparison = a.aiScore - b.aiScore;
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
            <SelectItem value="aiScore-desc">Highest Score</SelectItem>
            <SelectItem value="aiScore-asc">Lowest Score</SelectItem>
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
                      onClick={() => toggleSort('aiScore')}
                    >
                      AI Score
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
                      <div className="flex items-center gap-2">
                        <Progress value={app.aiScore} className="w-16 h-2" />
                        <span className={`text-sm font-medium ${getScoreColor(app.aiScore)}`}>
                          {app.aiScore}%
                        </span>
                      </div>
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
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No applications found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
