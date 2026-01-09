import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  mockHeadcountData, 
  mockRequisitions, 
  getPipelineSummary 
} from "@/lib/mockHiringManagerData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Users, Briefcase, Clock, CheckCircle } from "lucide-react";

export default function HiringManagerDashboard() {
  const pipelineSummary = getPipelineSummary();
  const openRequisitions = mockRequisitions.filter((r) => r.status === 'open');

  const pipelineCards = [
    { label: "Pending Review", value: pipelineSummary.pendingReview, icon: Clock, color: "text-amber-500" },
    { label: "Interview Scheduled", value: pipelineSummary.interviewScheduled, icon: Users, color: "text-blue-500" },
    { label: "Interviewed", value: pipelineSummary.interviewed, icon: Briefcase, color: "text-purple-500" },
    { label: "Hired", value: pipelineSummary.hired, icon: CheckCircle, color: "text-green-500" },
  ];

  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your department's hiring activities</p>
      </div>

      {/* Candidate Pipeline Summary */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Candidate Pipeline (HR Forwarded)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pipelineCards.map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Headcount vs Vacancy Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Headcount vs Vacancy</CardTitle>
          <CardDescription>Current staffing levels across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockHeadcountData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="department" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="headcount" name="Headcount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vacancy" name="Vacancy" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Open Requisitions */}
      <Card>
        <CardHeader>
          <CardTitle>Open Requisitions</CardTitle>
          <CardDescription>Active job openings for your department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {openRequisitions.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{req.title}</h3>
                    <Badge variant={priorityColors[req.priority]}>
                      {req.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{req.department}</p>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-sm font-medium text-foreground">
                    {req.filled} / {req.quantity} filled
                  </p>
                  <Progress 
                    value={(req.filled / req.quantity) * 100} 
                    className="h-2 mt-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
