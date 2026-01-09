import { 
  Clock, 
  DollarSign, 
  TrendingUp,
  Users,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { mockAnalytics } from '@/lib/mockHRData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function HRAnalytics() {
  const { timeToHire, costPerHire, quarterlyData, candidateSources, rejectionReasons } = mockAnalytics;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Key hiring metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time to Hire</p>
                <p className="text-3xl font-bold mt-1">{timeToHire}</p>
                <p className="text-sm text-muted-foreground">days avg</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>12% faster than last quarter</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost per Hire</p>
                <p className="text-3xl font-bold mt-1">${costPerHire.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">average</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>8% reduction from Q3</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offer Acceptance</p>
                <p className="text-3xl font-bold mt-1">87%</p>
                <p className="text-sm text-muted-foreground">rate</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>5% increase YoY</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quality of Hire</p>
                <p className="text-3xl font-bold mt-1">92</p>
                <p className="text-sm text-muted-foreground">score (out of 100)</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>3 points higher than target</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarterly Openings vs Fills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quarterly Openings vs Fills
            </CardTitle>
            <CardDescription>Comparison of job openings and successful hires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="quarter" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="openings" fill="hsl(var(--primary))" name="Openings" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fills" fill="hsl(142, 76%, 36%)" name="Fills" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Sources of Candidates
            </CardTitle>
            <CardDescription>Where our candidates come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={candidateSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="source"
                  >
                    {candidateSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rejection Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Rejection Reasons Analysis</CardTitle>
          <CardDescription>Understanding why candidates don't make it through</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rejectionReasons.map((reason, index) => (
              <div key={reason.reason} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{reason.reason}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{reason.count} candidates</span>
                    <span className="font-medium w-12 text-right">{reason.percentage}%</span>
                  </div>
                </div>
                <Progress value={reason.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hiring Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Hiring Funnel Conversion</CardTitle>
          <CardDescription>Candidate progression through stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { stage: 'Applications Received', count: 412, percentage: 100 },
              { stage: 'Passed AI Screening', count: 298, percentage: 72 },
              { stage: 'Phone Screen', count: 156, percentage: 38 },
              { stage: 'HR Interview', count: 89, percentage: 22 },
              { stage: 'Technical Interview', count: 52, percentage: 13 },
              { stage: 'Final Interview', count: 28, percentage: 7 },
              { stage: 'Offers Made', count: 22, percentage: 5 },
              { stage: 'Hired', count: 19, percentage: 5 },
            ].map((item, index) => (
              <div key={item.stage} className="flex items-center gap-4">
                <div className="w-40 text-sm font-medium">{item.stage}</div>
                <div className="flex-1">
                  <div 
                    className="h-8 bg-primary/80 rounded flex items-center justify-end pr-3 text-primary-foreground text-sm font-medium transition-all"
                    style={{ width: `${item.percentage}%` }}
                  >
                    {item.count}
                  </div>
                </div>
                <div className="w-12 text-sm text-muted-foreground text-right">
                  {item.percentage}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
