import { useSyncExternalStore, useCallback } from 'react';

const initialDepartments = [
  'Human Resources',
  'Engineering',
  'Marketing',
  'Analytics',
  'Design',
  'Finance',
  'Operations',
  'IT',
];

let departments = [...initialDepartments];
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function getSnapshot() {
  return departments;
}

export function useDepartments() {
  const deps = useSyncExternalStore(subscribe, getSnapshot);

  const addDepartment = useCallback((name: string) => {
    departments = [...departments, name];
    emitChange();
  }, []);

  const updateDepartment = useCallback((oldName: string, newName: string) => {
    departments = departments.map(d => d === oldName ? newName : d);
    emitChange();
  }, []);

  const removeDepartment = useCallback((name: string) => {
    departments = departments.filter(d => d !== name);
    emitChange();
  }, []);

  return { departments: deps, addDepartment, updateDepartment, removeDepartment };
}
