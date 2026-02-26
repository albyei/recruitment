import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockMPPRequests, mockCandidates, mockInterviews } from '@/lib/mockHRData';
import { usePipelineStages } from '@/lib/pipelineStageStore';

export default function HRDashboard() {
  const pipelineStages = usePipelineStages();
  const pendingMPPs = mockMPPRequests.filter(m => m.status === 'pending').length;
  const totalCandidates = mockCandidates.length;
  const upcomingInterviews = mockInterviews.filter(i => i.status === 'scheduled').length;
  const hiredThisMonth = mockCandidates.filter(c => c.stage === 'hired').length;

  const pipelineSummary = pipelineStages.map(stage => ({
    ...stage,
    count: mockCandidates.filter(c => c.stage === stage.key).length
  }));

  const recentCandidates = [...mockCandidates]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Jane</p>
        </div>
        <div className="flex gap-2">
          <Link to="/hr/candidates">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              View All Candidates
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending MPPs</p>
                <p className="text-3xl font-bold mt-1">{pendingMPPs}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <Link to="/hr/requisitions" className="text-sm text-primary hover:underline mt-3 inline-flex items-center gap-1">
              Review requests <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
                <p className="text-3xl font-bold mt-1">{totalCandidates}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Link to="/hr/candidates" className="text-sm text-primary hover:underline mt-3 inline-flex items-center gap-1">
              Manage candidates <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Interviews</p>
                <p className="text-3xl font-bold mt-1">{upcomingInterviews}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <Link to="/hr/interviews" className="text-sm text-primary hover:underline mt-3 inline-flex items-center gap-1">
              View schedule <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hired This Month</p>
                <p className="text-3xl font-bold mt-1">{hiredThisMonth}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <Link to="/hr/analytics" className="text-sm text-primary hover:underline mt-3 inline-flex items-center gap-1">
              View analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Kanban className="h-5 w-5" />
              Pipeline Overview
            </CardTitle>
            <CardDescription>Current candidate distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineSummary.map((stage) => (
              <div key={stage.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-muted-foreground">{stage.count} candidates</span>
                </div>
                <Progress 
                  value={(stage.count / totalCandidates) * 100} 
                  className="h-2"
                />
              </div>
            ))}
            <Link to="/hr/pipeline">
              <Button variant="outline" className="w-full mt-4">
                View Full Pipeline
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Candidates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Applications
            </CardTitle>
            <CardDescription>Latest candidate submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground">{candidate.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={candidate.aiScore >= 85 ? 'default' : 'secondary'}>
                      AI: {candidate.aiScore}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{candidate.appliedDate}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/hr/candidates">
              <Button variant="outline" className="w-full mt-4">
                View All Candidates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Actions
          </CardTitle>
          <CardDescription>Items requiring your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-amber-500/5 border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium">3 MPP Requests</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Awaiting your approval</p>
              <Link to="/hr/requisitions">
                <Button size="sm" variant="outline" className="mt-3">Review Now</Button>
              </Link>
            </div>
            <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
                <span className="font-medium">5 Candidates</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Ready for screening</p>
              <Link to="/hr/pipeline">
                <Button size="sm" variant="outline" className="mt-3">Review Now</Button>
              </Link>
            </div>
            <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">2 Interviews</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Scheduled for today</p>
              <Link to="/hr/interviews">
                <Button size="sm" variant="outline" className="mt-3">View Schedule</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kanban(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 5v11" />
      <path d="M12 5v6" />
      <path d="M18 5v14" />
    </svg>
  );
}
