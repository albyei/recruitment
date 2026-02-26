import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAllBenefits, addCustomBenefit, removeCustomBenefit, isCustomBenefit, type BenefitOption } from "@/lib/benefitsStore";

interface BenefitsSelectorProps {
  selectedBenefits: string[];
  onBenefitsChange: (benefits: string[]) => void;
}

export default function BenefitsSelector({ selectedBenefits, onBenefitsChange }: BenefitsSelectorProps) {
  const [benefits, setBenefits] = useState<BenefitOption[]>(getAllBenefits());
  const [customInputs, setCustomInputs] = useState<string[]>(['']);
  const [deleteTarget, setDeleteTarget] = useState<BenefitOption | null>(null);

  const toggleBenefit = (id: string) => {
    if (selectedBenefits.includes(id)) {
      onBenefitsChange(selectedBenefits.filter((b) => b !== id));
    } else {
      onBenefitsChange([...selectedBenefits, id]);
    }
  };

  const handleAddCustom = (index: number) => {
    const label = customInputs[index]?.trim();
    if (!label) return;
    const newBenefit = addCustomBenefit(label);
    setBenefits(getAllBenefits());
    onBenefitsChange([...selectedBenefits, newBenefit.id]);
    const updated = [...customInputs];
    updated[index] = '';
    setCustomInputs(updated);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeCustomBenefit(deleteTarget.id);
    setBenefits(getAllBenefits());
    onBenefitsChange(selectedBenefits.filter((b) => b !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <Label>Benefits *</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {benefits.map((benefit) => (
          <div key={benefit.id} className="flex items-center justify-between group">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`benefit-${benefit.id}`}
                checked={selectedBenefits.includes(benefit.id)}
                onCheckedChange={() => toggleBenefit(benefit.id)}
              />
              <Label htmlFor={`benefit-${benefit.id}`} className="font-normal cursor-pointer flex items-center gap-1.5">
                <span>{benefit.emoji}</span>
                <span>{benefit.label}</span>
              </Label>
            </div>
            {isCustomBenefit(benefit.id) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setDeleteTarget(benefit)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2">
        <Label className="text-sm text-muted-foreground">Others</Label>
        {customInputs.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={val}
              onChange={(e) => {
                const updated = [...customInputs];
                updated[i] = e.target.value;
                setCustomInputs(updated);
              }}
              placeholder="e.g., Optical Allowance"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom(i);
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddCustom(i)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCustomInputs([...customInputs, ''])}
          className="text-sm text-primary hover:underline"
        >
          Add other benefit
        </button>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
