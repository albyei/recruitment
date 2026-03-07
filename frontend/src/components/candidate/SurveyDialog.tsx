import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSurveyQuestions } from '@/lib/surveyQuestionStore';

interface SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  position: string;
  department: string;
  stage: 'Hired' | 'Rejected';
  onSubmit: (data: Record<string, any>) => void;
}

function ScaleSelector({ value, onChange, label, required }: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  required: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium leading-snug">{label} {required && <span className="text-destructive">*</span>}</Label>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground w-16 text-right pr-2 shrink-0">Not Agree</span>
        <div className="flex gap-1 flex-1 justify-center">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium border transition-all',
                value === n
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background border-border hover:border-primary/50 text-foreground'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground w-16 pl-2 shrink-0">Agree</span>
      </div>
    </div>
  );
}

export default function SurveyDialog({
  open, onOpenChange, applicationId, position, department, stage, onSubmit,
}: SurveyDialogProps) {
  const questions = useSurveyQuestions();
  const [positionApplied, setPositionApplied] = useState(position);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const reset = () => {
    setPositionApplied(position);
    setRatings({});
    setTextAnswers({});
    setImprovementSuggestion('');
    setContactEmail('');
  };

  const canSubmit = positionApplied.trim() !== '' && questions.every((q) => {
    if (!q.required) return true;
    if (q.type === 'rating') return (ratings[q.key] || 0) > 0;
    return (textAnswers[q.key] || '').trim() !== '';
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      applicationId,
      position,
      department,
      stage,
      candidateName: 'Andi Prasetyo',
      positionApplied,
      ...ratings,
      ...textAnswers,
      improvementSuggestion,
      contactEmail,
    });
    reset();
    onOpenChange(false);
  };

  const setRating = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const setTextAnswer = (key: string, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onOpenChange(false); } }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Experience Survey</DialogTitle>
          <DialogDescription>
            {stage === 'Hired' ? '🎉 Congratulations on your offer!' : 'Thank you for your time.'}
            {' '}We value your feedback to improve our recruitment process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Position Applied For */}
          <div className="space-y-2">
            <Label htmlFor="positionApplied" className="text-sm font-medium">Position Applied For <span className="text-destructive">*</span></Label>
            <Input
              id="positionApplied"
              value={positionApplied}
              onChange={(e) => setPositionApplied(e.target.value)}
              placeholder="e.g. DevOps Engineer"
            />
          </div>

          {/* Dynamic Questions */}
          {questions.map((q) => (
            q.type === 'rating' ? (
              <ScaleSelector
                key={q.key}
                label={q.label}
                value={ratings[q.key] || 0}
                onChange={(v) => setRating(q.key, v)}
                required={q.required}
              />
            ) : (
              <div key={q.key} className="space-y-2">
                <Label className="text-sm font-medium leading-snug">
                  {q.label} {q.required && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  placeholder="Your answer..."
                  value={textAnswers[q.key] || ''}
                  onChange={(e) => setTextAnswer(q.key, e.target.value)}
                  rows={3}
                />
              </div>
            )
          ))}

          {/* Improvement Suggestion */}
          <div className="space-y-2">
            <Label htmlFor="improvement" className="text-sm font-medium">
              Is there anything we could do to make the experience even better?
            </Label>
            <Textarea
              id="improvement"
              placeholder="Your suggestions are greatly appreciated..."
              value={improvementSuggestion}
              onChange={(e) => setImprovementSuggestion(e.target.value)}
              rows={3}
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-sm font-medium">
              If you are open to being contacted to help us improve, please leave your email (optional).
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="your.email@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Submit Survey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
