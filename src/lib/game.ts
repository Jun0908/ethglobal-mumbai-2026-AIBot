import type { Dialogue } from "./schemas";

export const scenes = [
  { id: "chai", title: "First Chai Date", subtitle: "チャイと、はじめまして。", description: "ムンバイの小さなカフェ。温かなチャイを片手に、気軽に話しかけてみよう。" },
  { id: "monsoon", title: "Monsoon Trouble", subtitle: "予報になかった、ふたりの時間。", description: "窓の向こうで雨が降り始めた。予定を変える？ もう一杯チャイを頼む？" },
  { id: "reconnection", title: "Reconnection", subtitle: "違いを知って、もう一度。", description: "すれ違いがあれば、別の言葉で伝えてみよう。違いがなければ、相手の大切にすることを聞いてみよう。" },
] as const;
export type Message = { role: "user" | "assistant"; text: string };
export type Game = {
  id: string; ownerId: string; personaId: string; personaVersion: number; matchId: string;
  scene: number; sceneTurns: number; completed: boolean; messages: Message[];
  checkpoint: number; emotion: Dialogue["emotion"]; event: Dialogue["conversationEvent"]; expiresAt: number;
};
export function advanceGame(game: Game, message: string, reply: Dialogue): Game {
  const next = structuredClone(game);
  next.messages.push({ role: "user", text: message }, { role: "assistant", text: reply.dialogue });
  next.sceneTurns += 1;
  next.emotion = reply.emotion;
  next.event = reply.conversationEvent;
  if (next.sceneTurns >= 3) {
    if (next.scene === 2) next.completed = true;
    else { next.scene += 1; next.sceneTurns = 0; next.checkpoint = next.messages.length; }
  }
  return next;
}
export function retryGame(game: Game): Game {
  return { ...game, messages: game.messages.slice(0, game.checkpoint), sceneTurns: 0, completed: false, emotion: "neutral", event: "none" };
}
export function publicGame(game: Game) {
  return { id: game.id, scene: game.scene, sceneTurns: game.sceneTurns, completed: game.completed, messages: game.messages, emotion: game.emotion, event: game.event };
}
