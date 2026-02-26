import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Eye, ChevronLeft } from 'lucide-react';
import { Candidate } from '@/lib/mockHRData';

const INTERVIEW_STAGES = ['hr-interview', 'user-interview', 'director-interview'];

const REJECTION_REASONS = [
  'Skill Set Mismatch',
  'Skill Level Mismatch',
  'Lack of Experience',
  'Industry Background Mismatch',
  'Culture Fit Alignment',
  'Salary Expectation Gap',
  'Long Joining Availability',
  'Competitive Candidate Pool',
  'Position Has Been Filled',
] as const;

interface RejectionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onSend: () => void;
}

export default function RejectionEmailDialog({
  open,
  onOpenChange,
  candidate,
  onSend,
}: RejectionEmailDialogProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const wasInterviewed = useMemo(() => {
    if (!candidate) return false;
    return INTERVIEW_STAGES.includes(candidate.stage);
  }, [candidate]);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSend = () => {
    onSend();
    setSelectedReasons([]);
    setShowPreview(false);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSelectedReasons([]);
      setShowPreview(false);
    }
    onOpenChange(value);
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showPreview && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPreview(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {showPreview ? 'Email Preview' : 'Rejection Email'}
          </DialogTitle>
          <DialogDescription>
            {showPreview
              ? `Preview the rejection email for ${candidate.name}`
              : `Select rejection reasons for ${candidate.name}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {!showPreview ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Template:</span>
                <Badge variant={wasInterviewed ? 'default' : 'secondary'}>
                  {wasInterviewed ? 'Post-Interview Rejection' : 'Pre-Interview Rejection'}
                </Badge>
                <span className="text-xs text-muted-foreground">(auto-detected)</span>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Select rejection reason(s):</p>
                <div className="space-y-2.5">
                  {REJECTION_REASONS.map((reason) => (
                    <div key={reason} className="flex items-center gap-2.5">
                      <Checkbox
                        id={reason}
                        checked={selectedReasons.includes(reason)}
                        onCheckedChange={() => toggleReason(reason)}
                      />
                      <Label htmlFor={reason} className="text-sm cursor-pointer">
                        {reason}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6 space-y-4 text-sm leading-relaxed">
              <p>Dear {candidate.name},</p>

              <p>
                Thank you for your interest in the <strong>{candidate.position}</strong> position at
                Wowrack and for taking the time to go through our recruitment process. We truly
                appreciate the effort you invested.
              </p>

              <p>
                After careful consideration, we have decided not to move forward with your application
                at this time. While we were impressed with your background, this decision is based on
                our current team needs and the alignment of the role. The primary considerations
                include:
              </p>

              {selectedReasons.length > 0 ? (
                <ul className="list-disc pl-6 space-y-1">
                  {selectedReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No rejection reasons selected.</p>
              )}

              <p>
                Please know that this outcome is not a negative reflection of your abilities. We
                genuinely value your experience, and your profile will remain in our talent database.
                If a future opportunity aligns better with your qualifications, we would be happy to
                reach out again. Sometimes, it simply comes down to the right timing and match.
              </p>

              <p>
                Thank you once again for your time, interest, and effort throughout the process.
              </p>

              {wasInterviewed && (
                <p>
                  If you'd like, you may also share your experience with our recruitment process here:
                  <br />
                  <span className="mt-1 inline-block">
                    👉{' '}
                    <a href="#" className="text-primary underline font-medium">
                      Interview Experience Survey
                    </a>
                  </span>
                </p>
              )}

              <p>Wishing you all the best in your career journey.</p>

              <p className="text-muted-foreground">
                Best regards,
                <br />
                Wowrack Recruitment Team
              </p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          {!showPreview ? (
            <Button
              onClick={() => setShowPreview(true)}
              disabled={selectedReasons.length === 0}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview Email
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={selectedReasons.length === 0}>
              <Send className="h-4 w-4 mr-1" />
              Send Rejection Email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
