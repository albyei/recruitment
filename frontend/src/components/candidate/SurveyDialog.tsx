import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  position: string;
  department: string;
  stage: 'Hired' | 'Rejected';
  onSubmit: (data: {
    applicationId: string;
    position: string;
    department: string;
    stage: 'Hired' | 'Rejected';
    candidateName: string;
    positionApplied: string;
    easyApplication: number;
    wellOrganized: number;
    timelyCommunication: number;
    supportiveRecruiter: number;
    feltRespected: number;
    fairInterview: number;
    clearUnderstanding: number;
    wouldApplyAgain: number;
    wouldRecommend: number;
    improvementSuggestion: string;
    contactEmail: string;
  }) => void;
}

function ScaleSelector({ value, onChange, label }: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium leading-snug">{label} <span className="text-destructive">*</span></Label>
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

const QUESTIONS = [
  { key: 'easyApplication', label: 'The job application process was easy.' },
  { key: 'wellOrganized', label: 'The recruitment process felt well-organized and easy to follow.' },
  { key: 'timelyCommunication', label: 'Communication from the recruitment team was timely and clear.' },
  { key: 'supportiveRecruiter', label: 'The recruiter was supportive, professional, and helpful throughout the process.' },
  { key: 'feltRespected', label: 'I felt respected and valued as a candidate during the recruitment process.' },
  { key: 'fairInterview', label: 'The interview and assessment process felt fair and relevant to the role.' },
  { key: 'clearUnderstanding', label: 'I gained a clear understanding of the role and expectations during the recruitment process.' },
  { key: 'wouldApplyAgain', label: 'Based on this experience, I would consider applying for future opportunities at Wowrack.' },
  { key: 'wouldRecommend', label: 'I would recommend applying to Wowrack to a friend or colleague.' },
] as const;

type RatingKey = typeof QUESTIONS[number]['key'];

export default function SurveyDialog({
  open, onOpenChange, applicationId, position, department, stage, onSubmit,
}: SurveyDialogProps) {
  const [positionApplied, setPositionApplied] = useState(position);
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    easyApplication: 0,
    wellOrganized: 0,
    timelyCommunication: 0,
    supportiveRecruiter: 0,
    feltRespected: 0,
    fairInterview: 0,
    clearUnderstanding: 0,
    wouldApplyAgain: 0,
    wouldRecommend: 0,
  });
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const reset = () => {
    setPositionApplied(position);
    setRatings({
      easyApplication: 0, wellOrganized: 0, timelyCommunication: 0,
      supportiveRecruiter: 0, feltRespected: 0, fairInterview: 0,
      clearUnderstanding: 0, wouldApplyAgain: 0, wouldRecommend: 0,
    });
    setImprovementSuggestion('');
    setContactEmail('');
  };

  const allRated = Object.values(ratings).every((v) => v > 0);
  const canSubmit = positionApplied.trim() !== '' && allRated;

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
      improvementSuggestion,
      contactEmail,
    });
    reset();
    onOpenChange(false);
  };

  const setRating = (key: RatingKey, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
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

          {/* Rating Questions */}
          {QUESTIONS.map((q) => (
            <ScaleSelector
              key={q.key}
              label={q.label}
              value={ratings[q.key]}
              onChange={(v) => setRating(q.key, v)}
            />
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
