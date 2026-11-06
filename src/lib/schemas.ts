import { z } from "zod";

const trait = z.string().max(500).nullable();
export const personaContentSchema = z.object({
  personality: z.object({ socialStyle: trait, humor: trait, values: z.array(z.string().max(100)).max(8), relationshipPace: trait }),
  communication: z.object({ tone: trait, sentenceLength: trait, asksFollowUpQuestions: z.boolean().nullable(), handlesSilence: trait }),
  behaviorExamples: z.array(z.object({ situation: z.string().max(300), response: z.string().max(500), tendency: z.string().max(150) })).max(8),
  conflictBehavior: z.object({ initialReaction: trait, repairStyle: trait }),
});
export type PersonaContent = z.infer<typeof personaContentSchema>;
export const emotions = ["neutral", "happy", "shy", "surprised", "troubled"] as const;
export const dialogueSchema = z.object({
  dialogue: z.string().min(1).max(700), emotion: z.enum(emotions), tone: z.string().max(100),
  conversationEvent: z.enum(["connection", "personality_difference", "rain", "repair", "none"]),
  suggestedNextAction: z.enum(["continue", "reflect"]),
});
export type Dialogue = z.infer<typeof dialogueSchema>;
export const answerSchema = z.object({ question: z.string().min(1).max(500), summary: z.string().min(1).max(1200) }).strict();
export type Answer = z.infer<typeof answerSchema>;
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const approvedAnswersSchema = z.object({ answers: z.array(answerSchema).min(1).max(12), sendApproved: z.literal(true) }).strict();
export const scenarios = [
  "Your date says they love big parties. How do you respond?",
  "You disagree about where to go. How do you express it?",
  "A sudden rain shower interrupts your date. What do you say?",
];
export const interviewQuestions = [
  "初対面の人とは、どんなふうに話しますか？ 実際に言いそうな言葉も教えてください。",
  "相手が自分とは違う趣味を持っていたら、どう反応しますか？",
  "会話が途切れたら、普段どんな言葉をかけますか？",
  "相手と意見が違ったとき、どんな言い方をしますか？",
  "気になる人には、どんな冗談を言いますか？",
  "初デートで緊張したら、どう振る舞いますか？",
];
