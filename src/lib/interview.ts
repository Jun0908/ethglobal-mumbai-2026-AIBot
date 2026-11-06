export const INTERVIEW_LIMIT = 6;

// A skipped question uses a slot too: the interview always has a visible end.
export function interviewProgress(answerCount: number, skipped: number) {
  const completed = Math.min(answerCount + skipped, INTERVIEW_LIMIT);
  return { completed, remaining: INTERVIEW_LIMIT - completed, finished: completed >= INTERVIEW_LIMIT };
}

export type InterviewNext =
  | { completed: true; question: null }
  | { completed: false; question: string; options: string[] };

export const interviewOptions = [
  ["まず相手の話を聞いて、少しずつ話す", "自分から明るく話しかける", "共通の話題を見つけて話す"],
  ["どんなところが好きなのか聞いてみる", "一緒に試してみたいと伝える", "違いを楽しみながら、自分の趣味も話す"],
  ["沈黙も気にせず、ゆっくり待つ", "身近な話題で会話を再開する", "軽い冗談で場を和ませる"],
  ["相手の理由を聞いてから、自分の考えを伝える", "自分の考えを率直に伝える", "お互いが納得できる案を一緒に探す"],
  ["日常の小さな失敗を笑い話にする", "軽い言葉遊びで笑ってもらう", "無理に冗談を言わず、自然に話す"],
  ["緊張していると素直に伝える", "相手に質問して、話を聞く", "チャイを飲んでゆっくり落ち着く"],
] as const;
