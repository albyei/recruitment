import { useState, useMemo } from 'react';
import { useSurveys, SurveyResponse } from '@/lib/surveyStore';
import { useSurveyQuestions, addSurveyQuestion, updateSurveyQuestion, removeSurveyQuestion, reorderSurveyQuestions, SurveyQuestionType } from '@/lib/surveyQuestionStore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Star, Eye, ClipboardList, TrendingUp, Settings, Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, X } from 'lucide-react';

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
  const surveyQuestions = useSurveyQuestions();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selected, setSelected] = useState<SurveyResponse | null>(null);

  // Question editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<SurveyQuestionType>('rating');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

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

  const ratingQuestions = surveyQuestions.filter((q) => q.type === 'rating');
  const ratingKeys = ratingQuestions.map((q) => q.key);

  const avgOverall = surveys.length
    ? (surveys.reduce((sum, s) => {
        const vals = ratingKeys.map((k) => (s as any)[k] as number || 0);
        const validVals = vals.filter((v) => v > 0);
        return sum + (validVals.length ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0);
      }, 0) / surveys.length).toFixed(1)
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

  const handleAddQuestion = () => {
    if (!newQuestionLabel.trim()) return;
    addSurveyQuestion(newQuestionLabel.trim(), newQuestionType, newQuestionRequired);
    setNewQuestionLabel('');
    setNewQuestionType('rating');
    setNewQuestionRequired(true);
  };

  const handleStartEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditingLabel(label);
  };

  const handleSaveEdit = () => {
    if (editingId && editingLabel.trim()) {
      updateSurveyQuestion(editingId, { label: editingLabel.trim() });
    }
    setEditingId(null);
    setEditingLabel('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Candidate Surveys</h1>
          <p className="text-muted-foreground mt-1">Review feedback from hired and rejected candidates</p>
        </div>
        <Button variant="outline" onClick={() => setEditorOpen(true)}>
          <Settings className="h-4 w-4 mr-2" /> Customize Questions
        </Button>
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
      <div className="grid grid-cols-2 gap-4">
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
                const vals = ratingKeys.map((k) => (s as any)[k] as number || 0).filter((v) => v > 0);
                const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 'N/A';
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
                    <TableCell className="font-semibold">{avg === 'N/A' ? avg : `${avg}/10`}</TableCell>
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responses</p>
              <div className="space-y-3">
                {surveyQuestions.map((q) => {
                  const val = (selected as any)[q.key];
                  if (val === undefined || val === null || val === '') return null;
                  if (q.type === 'rating') {
                    return <RatingBar key={q.key} label={q.label} value={val as number} />;
                  }
                  return (
                    <div key={q.key} className="space-y-1">
                      <span className="text-sm text-muted-foreground">{q.label}</span>
                      <p className="text-sm bg-muted/50 rounded-lg p-3">{val as string}</p>
                    </div>
                  );
                })}
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

      {/* Question Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Survey Questions</DialogTitle>
            <DialogDescription>Add, edit, reorder, or remove questions. Changes apply to all future surveys.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {surveyQuestions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                {editingId === q.id ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="default" onClick={handleSaveEdit}><Check className="h-3 w-3 mr-1" />Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-1.5">
                      <span className="text-sm leading-relaxed block">{q.label}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {q.type === 'rating' ? 'Rating 1–10' : 'Text Field'}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={q.required}
                            onCheckedChange={(checked) => updateSurveyQuestion(q.id, { required: checked })}
                            className="scale-75"
                          />
                          <span className="text-[10px] text-muted-foreground">{q.required ? 'Required' : 'Optional'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Type toggle */}
                      <Select
                        value={q.type}
                        onValueChange={(v) => updateSurveyQuestion(q.id, { type: v as SurveyQuestionType })}
                      >
                        <SelectTrigger className="h-7 w-[80px] text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => reorderSurveyQuestions(idx, idx - 1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === surveyQuestions.length - 1} onClick={() => reorderSurveyQuestions(idx, idx + 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(q.id, q.label)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeSurveyQuestion(q.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add New Question</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter question statement..."
                  value={newQuestionLabel}
                  onChange={(e) => setNewQuestionLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                  className="flex-1"
                />
                <Select value={newQuestionType} onValueChange={(v) => setNewQuestionType(v as SurveyQuestionType)}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={newQuestionRequired} onCheckedChange={setNewQuestionRequired} />
                  <span className="text-sm text-muted-foreground">{newQuestionRequired ? 'Required' : 'Optional'}</span>
                </div>
                <Button onClick={handleAddQuestion} disabled={!newQuestionLabel.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
