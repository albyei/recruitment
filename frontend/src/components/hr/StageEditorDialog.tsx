import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Settings2, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  PipelineStageConfig, FIXED_STAGES, setStages, getNextColor, labelToKey,
} from '@/lib/pipelineStageStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStages: PipelineStageConfig[];
  candidateCountByStage: Record<string, number>;
  onStagesSaved: (removed: string[]) => void;
}

export default function StageEditorDialog({
  open, onOpenChange, currentStages, candidateCountByStage, onStagesSaved,
}: Props) {
  const [draft, setDraft] = useState<PipelineStageConfig[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removedStageKeys, setRemovedStageKeys] = useState<string[]>([]);
  const { toast } = useToast();

  // Initialize draft when dialog opens
  useEffect(() => {
    if (open) {
      setDraft([...currentStages]);
      setNewLabel('');
    }
  }, [open, currentStages]);

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
  };

  const addStage = () => {
    const label = newLabel.trim();
    if (!label) return;
    const key = labelToKey(label);
    if (draft.some((s) => s.key === key)) {
      toast({ title: 'Stage already exists', variant: 'destructive' });
      return;
    }
    // Insert before 'hired' (second to last) and 'rejected' (last)
    const hiredIdx = draft.findIndex((s) => s.key === 'hired');
    const newStage: PipelineStageConfig = { key, label, color: getNextColor(draft) };
    const updated = [...draft];
    updated.splice(hiredIdx, 0, newStage);
    setDraft(updated);
    setNewLabel('');
  };

  const removeStage = (key: string) => {
    setDraft((prev) => prev.filter((s) => s.key !== key));
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    setDraft((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
      return updated;
    });
  };

  const handleSave = () => {
    const currentKeys = new Set(currentStages.map((s) => s.key));
    const draftKeys = new Set(draft.map((s) => s.key));
    const removed = [...currentKeys].filter((k) => !draftKeys.has(k));

    const affectedCandidates = removed.reduce((sum, key) => sum + (candidateCountByStage[key] || 0), 0);

    if (affectedCandidates > 0) {
      setRemovedStageKeys(removed);
      setConfirmOpen(true);
    } else {
      applyChanges([]);
    }
  };

  const applyChanges = (removed: string[]) => {
    setStages(draft);
    onStagesSaved(removed);
    onOpenChange(false);
    toast({ title: 'Pipeline stages updated' });
  };

  const confirmAndApply = () => {
    setConfirmOpen(false);
    applyChanges(removedStageKeys);
  };

  // Movable range: between applied (index 0) and hired/rejected (last 2)
  const canMoveUp = (i: number) => i > 1; // can't move above 'applied'
  const canMoveDown = (i: number) => i < draft.length - 3; // can't move into hired/rejected
  const canRemove = (key: string) => !FIXED_STAGES.includes(key);

  const affectedCount = removedStageKeys.reduce(
    (sum, key) => sum + (candidateCountByStage[key] || 0), 0,
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> Customize Pipeline Stages
            </DialogTitle>
            <DialogDescription>
              Add, remove, or reorder stages. Applied, Hired, and Rejected cannot be removed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {draft.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className={`h-3 w-3 rounded-full ${stage.color} flex-shrink-0`} />
                <span className="text-sm font-medium flex-1">{stage.label}</span>
                {FIXED_STAGES.includes(stage.key) && (
                  <Badge variant="outline" className="text-[10px]">Fixed</Badge>
                )}
                {candidateCountByStage[stage.key] > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {candidateCountByStage[stage.key]}
                  </Badge>
                )}
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    disabled={!canMoveUp(i)}
                    onClick={() => moveStage(i, 'up')}
                  >↑</Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    disabled={!canMoveDown(i)}
                    onClick={() => moveStage(i, 'down')}
                  >↓</Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    disabled={!canRemove(stage.key)}
                    onClick={() => removeStage(stage.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="New stage name..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStage()}
              className="h-9"
            />
            <Button size="sm" onClick={addStage} disabled={!newLabel.trim()} className="h-9">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Stage Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              {affectedCount} candidate{affectedCount !== 1 ? 's' : ''} in deleted stage{removedStageKeys.length !== 1 ? 's' : ''} will
              be moved to the <strong>Applied</strong> stage (earliest stage). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndApply}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
