export const INTERVIEW_LIMIT = 6;

// A skipped question uses a slot too: the interview always has a visible end.
export function interviewProgress(answerCount: number, skipped: number) {
  const completed = Math.min(answerCount + skipped, INTERVIEW_LIMIT);
  return { completed, remaining: INTERVIEW_LIMIT - completed, finished: completed >= INTERVIEW_LIMIT };
}

export type InterviewNext = { completed: boolean; question: string | null };
