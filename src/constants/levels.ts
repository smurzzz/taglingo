export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export type Level = (typeof LEVELS)[number];
