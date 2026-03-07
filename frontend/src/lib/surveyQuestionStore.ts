import { useSyncExternalStore } from 'react';

export type SurveyQuestionType = 'rating' | 'text';

export interface SurveyQuestion {
  id: string;
  key: string;
  label: string;
  type: SurveyQuestionType;
  required: boolean;
}

const DEFAULT_QUESTIONS: SurveyQuestion[] = [
  { id: 'q1', key: 'easyApplication', label: 'The job application process was easy.', type: 'rating', required: true },
  { id: 'q2', key: 'wellOrganized', label: 'The recruitment process felt well-organized and easy to follow.', type: 'rating', required: true },
  { id: 'q3', key: 'timelyCommunication', label: 'Communication from the recruitment team was timely and clear.', type: 'rating', required: true },
  { id: 'q4', key: 'supportiveRecruiter', label: 'The recruiter was supportive, professional, and helpful throughout the process.', type: 'rating', required: true },
  { id: 'q5', key: 'feltRespected', label: 'I felt respected and valued as a candidate during the recruitment process.', type: 'rating', required: true },
  { id: 'q6', key: 'fairInterview', label: 'The interview and assessment process felt fair and relevant to the role.', type: 'rating', required: true },
  { id: 'q7', key: 'clearUnderstanding', label: 'I gained a clear understanding of the role and expectations during the recruitment process.', type: 'rating', required: true },
  { id: 'q8', key: 'wouldApplyAgain', label: 'Based on this experience, I would consider applying for future opportunities at Wowrack.', type: 'rating', required: true },
  { id: 'q9', key: 'wouldRecommend', label: 'I would recommend applying to Wowrack to a friend or colleague.', type: 'rating', required: true },
];

function loadQuestions(): SurveyQuestion[] {
  try {
    const stored = localStorage.getItem('surveyQuestions');
    if (stored) {
      const parsed = JSON.parse(stored) as any[];
      // Migrate old questions without type/required
      return parsed.map((q) => ({
        ...q,
        type: q.type || 'rating',
        required: q.required !== undefined ? q.required : true,
      }));
    }
  } catch {}
  return DEFAULT_QUESTIONS;
}

let questions: SurveyQuestion[] = loadQuestions();
let listeners: Array<() => void> = [];

function emitChange() {
  localStorage.setItem('surveyQuestions', JSON.stringify(questions));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

export function getSurveyQuestions() {
  return questions;
}

export function setSurveyQuestions(newQuestions: SurveyQuestion[]) {
  questions = [...newQuestions];
  emitChange();
}

export function addSurveyQuestion(label: string, type: SurveyQuestionType = 'rating', required: boolean = true) {
  const id = `q-${Date.now()}`;
  const key = `custom_${id}`;
  questions = [...questions, { id, key, label, type, required }];
  emitChange();
}

export function updateSurveyQuestion(id: string, updates: Partial<Pick<SurveyQuestion, 'label' | 'type' | 'required'>>) {
  questions = questions.map((q) => (q.id === id ? { ...q, ...updates } : q));
  emitChange();
}

export function removeSurveyQuestion(id: string) {
  questions = questions.filter((q) => q.id !== id);
  emitChange();
}

export function reorderSurveyQuestions(fromIndex: number, toIndex: number) {
  const updated = [...questions];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  questions = updated;
  emitChange();
}

export function useSurveyQuestions() {
  return useSyncExternalStore(subscribe, getSurveyQuestions, getSurveyQuestions);
}
