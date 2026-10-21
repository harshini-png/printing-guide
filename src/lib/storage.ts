// Local storage helper for personal reading checklist progress per guide

const PREFIX = 'printmate_progress_';

export function getGuideProgress(guideId: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${PREFIX}${guideId}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse guide progress:', err);
    return {};
  }
}

export function setStepCompleted(guideId: string, stepId: string, completed: boolean): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const current = getGuideProgress(guideId);
    if (completed) {
      current[stepId] = true;
    } else {
      delete current[stepId];
    }
    localStorage.setItem(`${PREFIX}${guideId}`, JSON.stringify(current));
    return { ...current };
  } catch (err) {
    console.error('Failed to save step progress:', err);
    return {};
  }
}

export function resetGuideProgress(guideId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${PREFIX}${guideId}`);
  } catch (err) {
    console.error('Failed to reset guide progress:', err);
  }
}
