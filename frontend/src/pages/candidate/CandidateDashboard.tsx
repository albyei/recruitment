import { Clock, Calendar, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApplicationStatusCounts, mockCandidateApplications } from '@/lib/mockCandidateData';

const statusCards = [
  {
    label: 'Under Review',
    key: 'underReview' as const,
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    label: 'Interview',
    key: 'interview' as const,
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'Rejected',
    key: 'rejected' as const,
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    label: 'Hired',
    key: 'hired' as const,
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
];

export default function CandidateDashboard() {
  const counts = getApplicationStatusCounts();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your application status</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statusCards.map((status) => (
          <Card key={status.key}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${status.bgColor}`}>
                  <status.icon className={`h-6 w-6 ${status.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold">{counts[status.key]}</p>
                  <p className="text-sm text-muted-foreground">{status.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCandidateApplications.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div>
                  <p className="font-medium">{app.position}</p>
                  <p className="text-sm text-muted-foreground">{app.department}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      app.currentStage === 'Hired'
                        ? 'bg-green-500/10 text-green-600'
                        : app.currentStage === 'Rejected'
                        ? 'bg-destructive/10 text-destructive'
                        : app.currentStage === 'Interview'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {app.currentStage}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{app.nextStep}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
