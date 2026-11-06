import { z } from "zod";
import type { Locale } from "./i18n";
import { dimensionIds, type ConversationMessage, type DimensionId } from "./conversation";

export const observationIds = ["aligned", "different", "adapted", "mixed", "unknown"] as const;
const candidateSchema = z.object({
  dimension: z.enum(dimensionIds), observation: z.enum(observationIds),
  interpretation: z.string().max(500), unknowns: z.string().max(300),
  evidence: z.array(z.object({ messageId: z.string(), quote: z.string().min(1).max(500), purpose: z.enum(["preference", "difference", "proposal", "acceptance"]) })).max(8),
});
export const reflectionSchema = z.object({ dimensions: z.array(candidateSchema).max(4) });
export type ReflectionCandidate = z.infer<typeof reflectionSchema>;
export type Evidence = { messageId: string; quote: string; start: number; end: number; role: "user" | "assistant"; kind: ConversationMessage["kind"]; sequence: number; purpose: "preference" | "difference" | "proposal" | "acceptance" };
export type ReflectionDimension = { dimension: DimensionId; observation: typeof observationIds[number]; interpretation: string; unknowns: string; evidence: Evidence[] };
export type Reflection = { id: string; gameId: string; revision: number; locale: Locale; version: 1; generatedAt: number; dimensions: ReflectionDimension[] };
export function unknownDimension(dimension: DimensionId, locale: Locale): ReflectionDimension {
  return { dimension, observation: "unknown", interpretation: locale === "en" ? "There is not enough conversation evidence yet." : "判断に必要な会話の根拠がまだ足りません。", unknowns: locale === "en" ? "Keep talking about what matters to you, if you wish." : "話したい範囲で、お互いの希望をもう少し知ってみましょう。", evidence: [] };
}
// Validate provenance and structural support, not the correctness of the model's interpretation.
export function validateReflection(candidate: ReflectionCandidate, messages: ConversationMessage[], locale: Locale): ReflectionDimension[] {
  return dimensionIds.map(dimension => {
    const rows = candidate.dimensions.filter(row => row.dimension === dimension);
    if (rows.length !== 1 || rows[0].observation === "unknown") return unknownDimension(dimension, locale);
    const row = rows[0];
    const evidence: Evidence[] = [];
    for (const ref of row.evidence) {
      const source = messages.find(m => m.id === ref.messageId);
      if (!source || source.kind === "story_action" || evidence.some(e => e.messageId === ref.messageId)) return unknownDimension(dimension, locale);
      const start = source.text.indexOf(ref.quote);
      if (start < 0) return unknownDimension(dimension, locale);
      evidence.push({ ...ref, quote: source.text.slice(start, start + ref.quote.length), start, end: start + ref.quote.length, role: source.role, kind: source.kind, sequence: source.sequence });
    }
    if (!evidence.some(e => e.role === "user") || !evidence.some(e => e.role === "assistant")) return unknownDimension(dimension, locale);
    if (row.observation === "adapted") {
      const difference = evidence.find(e => e.purpose === "difference");
      const proposal = evidence.find(e => e.purpose === "proposal" && difference && e.sequence > difference.sequence);
      const acceptance = evidence.find(e => e.purpose === "acceptance" && proposal && e.sequence > proposal.sequence && e.role !== proposal.role);
      if (!difference || !proposal || !acceptance) return unknownDimension(dimension, locale);
    }
    if (row.observation === "mixed" && evidence.length < 3) return unknownDimension(dimension, locale);
    return { dimension, observation: row.observation, interpretation: row.interpretation, unknowns: row.unknowns, evidence };
  });
}
