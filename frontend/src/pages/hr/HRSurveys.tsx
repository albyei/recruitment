import { useState, useMemo } from 'react';
import { useSurveys, SurveyResponse } from '@/lib/surveyStore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, Star, Eye, ClipboardList, TrendingUp, ThumbsUp } from 'lucide-react';

const QUESTION_LABELS: Record<string, string> = {
  easyApplication: 'Application process was easy',
  wellOrganized: 'Well-organized process',
  timelyCommunication: 'Timely & clear communication',
  supportiveRecruiter: 'Supportive & professional recruiter',
  feltRespected: 'Felt respected & valued',
  fairInterview: 'Fair & relevant interview',
  clearUnderstanding: 'Clear role understanding',
  wouldApplyAgain: 'Would apply again',
  wouldRecommend: 'Would recommend to others',
};

function RatingBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${value * 10}%` }} />
        </div>
        <span className="text-sm font-semibold w-8 text-right">{value}/10</span>
      </div>
    </div>
  );
}

export default function HRSurveys() {
  const { surveys } = useSurveys();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selected, setSelected] = useState<SurveyResponse | null>(null);

  const filtered = useMemo(() => {
    let result = [...surveys];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.candidateName.toLowerCase().includes(q) ||
          s.position.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
    }
    if (stageFilter !== 'all') {
      result = result.filter((s) => s.stage === stageFilter);
    }
    return result;
  }, [surveys, search, stageFilter]);

  const ratingKeys = Object.keys(QUESTION_LABELS) as Array<keyof typeof QUESTION_LABELS>;

  const avgOverall = surveys.length
    ? (surveys.reduce((sum, s) => {
        const vals = ratingKeys.map((k) => (s as any)[k] as number || 0);
        return sum + vals.reduce((a, b) => a + b, 0) / vals.length;
      }, 0) / surveys.length).toFixed(1)
    : '0';

  const avgRecommend = surveys.length
    ? (surveys.reduce((sum, s) => sum + (s.wouldRecommend || 0), 0) / surveys.length).toFixed(1)
    : '0';

  // NPS Calculation based on wouldRecommend score
  const npsData = useMemo(() => {
    if (surveys.length === 0) return { promoters: 0, passives: 0, detractors: 0, pctPromoter: 0, pctPassive: 0, pctDetractor: 0, nps: 0 };
    let promoters = 0, passives = 0, detractors = 0;
    surveys.forEach((s) => {
      const score = s.wouldRecommend || 0;
      if (score >= 9) promoters++;
      else if (score >= 7) passives++;
      else detractors++;
    });
    const total = surveys.length;
    const pctPromoter = Math.round((promoters / total) * 100);
    const pctPassive = Math.round((passives / total) * 100);
    const pctDetractor = Math.round((detractors / total) * 100);
    const nps = pctPromoter - pctDetractor;
    return { promoters, passives, detractors, pctPromoter, pctPassive, pctDetractor, nps };
  }, [surveys]);

  // Anonymize candidate name
  const anonymize = (name: string) => {
    const parts = name.split(' ');
    return parts.map((p) => p[0] + '***').join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Candidate Surveys</h1>
        <p className="text-muted-foreground mt-1">Review feedback from hired and rejected candidates</p>
      </div>

      {/* NPS Section */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Candidate NPS</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{surveys.length}</p>
              <p className="text-xs text-muted-foreground">Total Respondents</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-600">{npsData.pctPromoter}%</p>
              <p className="text-xs text-muted-foreground">Promoters (9–10)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-500/10">
              <p className="text-2xl font-bold text-yellow-600">{npsData.pctPassive}%</p>
              <p className="text-xs text-muted-foreground">Passives (7–8)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <p className="text-2xl font-bold text-red-600">{npsData.pctDetractor}%</p>
              <p className="text-xs text-muted-foreground">Detractors (1–6)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className={`text-3xl font-bold ${npsData.nps >= 0 ? 'text-green-600' : 'text-red-600'}`}>{npsData.nps}</p>
              <p className="text-xs text-muted-foreground">NPS Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{surveys.length}</p>
              <p className="text-xs text-muted-foreground">Total Responses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Star className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgOverall}</p>
              <p className="text-xs text-muted-foreground">Avg. Score (out of 10)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ThumbsUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgRecommend}</p>
              <p className="text-xs text-muted-foreground">Avg. Recommend Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, position, department..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="Hired">Hired</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const avg = (ratingKeys.reduce((sum, k) => sum + ((s as any)[k] as number || 0), 0) / ratingKeys.length).toFixed(1);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{anonymize(s.candidateName)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{s.positionApplied || s.position}</p>
                        <p className="text-xs text-muted-foreground">{s.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.stage === 'Hired' ? 'default' : 'destructive'} className="text-xs">
                        {s.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{avg}/10</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No survey responses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Response</DialogTitle>
            <DialogDescription>{selected ? anonymize(selected.candidateName) : ''} — {selected?.positionApplied || selected?.position}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outcome</span>
                <Badge variant={selected.stage === 'Hired' ? 'default' : 'destructive'}>{selected.stage}</Badge>
              </div>

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ratings</p>
              <div className="space-y-3">
                {ratingKeys.map((key) => (
                  <RatingBar key={key} label={QUESTION_LABELS[key]} value={(selected as any)[key] || 0} />
                ))}
              </div>

              {selected.improvementSuggestion && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Improvement Suggestions</span>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selected.improvementSuggestion}</p>
                  </div>
                </>
              )}

              {selected.contactEmail && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Contact Email</span>
                  <p className="text-sm">{selected.contactEmail}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
