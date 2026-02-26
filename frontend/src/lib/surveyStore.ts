import { useSyncExternalStore } from 'react';

export interface SurveyResponse {
  id: string;
  applicationId: string;
  candidateName: string;
  position: string;
  department: string;
  stage: 'Hired' | 'Rejected';
  submittedAt: string;
  // New fields
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
}

let surveys: SurveyResponse[] = [
  {
    id: 'survey-1',
    applicationId: '6',
    candidateName: 'Andi Prasetyo',
    position: 'DevOps Engineer',
    department: 'Engineering',
    stage: 'Hired',
    submittedAt: '2025-01-28',
    positionApplied: 'DevOps Engineer',
    easyApplication: 9,
    wellOrganized: 8,
    timelyCommunication: 9,
    supportiveRecruiter: 10,
    feltRespected: 9,
    fairInterview: 8,
    clearUnderstanding: 9,
    wouldApplyAgain: 10,
    wouldRecommend: 9,
    improvementSuggestion: 'Could provide more timeline clarity between stages.',
    contactEmail: 'andi@example.com',
  },
];

let listeners: Array<() => void> = [];

function emitChange() {
  listeners.forEach((l) => l());
}

export function getSurveys() {
  return surveys;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function addSurvey(survey: Omit<SurveyResponse, 'id' | 'submittedAt'>) {
  const newSurvey: SurveyResponse = {
    ...survey,
    id: `survey-${Date.now()}`,
    submittedAt: new Date().toISOString().split('T')[0],
  };
  surveys = [...surveys, newSurvey];
  emitChange();
}

export function hasSubmittedSurvey(applicationId: string): boolean {
  return surveys.some((s) => s.applicationId === applicationId);
}

export function useSurveys() {
  const data = useSyncExternalStore(subscribe, getSurveys, getSurveys);
  return { surveys: data, addSurvey, hasSubmittedSurvey };
}
