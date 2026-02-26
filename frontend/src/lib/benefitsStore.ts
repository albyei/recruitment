export interface BenefitOption {
  id: string;
  label: string;
  emoji: string;
}

const DEFAULT_BENEFITS: BenefitOption[] = [
  { id: 'competitive_salary', label: 'Competitive Salary', emoji: '💰' },
  { id: 'medical_insurance', label: 'Medical Insurance', emoji: '🏥' },
  { id: 'dental_insurance', label: 'Dental Insurance', emoji: '🦷' },
  { id: 'thr_bonus', label: 'THR / Bonus System', emoji: '🎁' },
  { id: 'period_leave', label: 'Period Leave', emoji: '👩' },
  { id: 'transportation', label: 'Transportation', emoji: '🚌' },
  { id: 'free_lunch', label: 'Free Lunch', emoji: '🍱' },
  { id: 'free_food_snacks', label: 'Free Food / Snacks', emoji: '🍪' },
  { id: 'international_exposure', label: 'International Exposure', emoji: '🌍' },
  { id: 'team_building', label: 'Team Building Activity', emoji: '👥' },
  { id: 'self_development', label: 'Self-development Allowance', emoji: '📚' },
  { id: 'casual_dress', label: 'Casual Dress Code', emoji: '👕' },
  { id: 'childcare', label: 'Childcare Assistance', emoji: '👶' },
  { id: 'company_outings', label: 'Company Outings', emoji: '🎉' },
  { id: 'employee_discounts', label: 'Employee Discounts', emoji: '🏷️' },
  { id: 'gym_membership', label: 'Gym Membership', emoji: '💪' },
  { id: 'maternity_paternity', label: 'Paid Maternity / Paternity Leave', emoji: '👨‍👩‍👧' },
  { id: 'paid_sick_days', label: 'Paid Sick Days', emoji: '🤒' },
  { id: 'pet_friendly', label: 'Pet-friendly Office', emoji: '🐾' },
  { id: 'professional_development', label: 'Professional Development', emoji: '📈' },
  { id: 'recreational_area', label: 'Recreational Area', emoji: '🎮' },
  { id: 'vacation_time', label: 'Vacation Time', emoji: '🏖️' },
  { id: 'wellness_program', label: 'Wellness Program', emoji: '😎' },
];

let customBenefits: BenefitOption[] = [];

export function getAllBenefits(): BenefitOption[] {
  return [...DEFAULT_BENEFITS, ...customBenefits];
}

export function addCustomBenefit(label: string): BenefitOption {
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const benefit: BenefitOption = { id, label, emoji: '✨' };
  customBenefits.push(benefit);
  return benefit;
}

export function removeCustomBenefit(id: string): void {
  customBenefits = customBenefits.filter((b) => b.id !== id);
}

export function isCustomBenefit(id: string): boolean {
  return customBenefits.some((b) => b.id === id);
}

export function getCustomBenefits(): BenefitOption[] {
  return [...customBenefits];
}
