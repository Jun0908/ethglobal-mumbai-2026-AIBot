/** Extra deterministic checks for the observed speaker-reversal regressions.
 * These checks supplement semantic review; they are not a general language parser. */
export function keepsPlayerPerspective(player: string, candidate: string) {
  if (/Alternative suggestions|in JSON|```|[{}\[\]]/i.test(candidate)) return false;
  if (!/祖母|おばあ|grandma|grandmother/i.test(player) && /祖母|おばあ|grandma|grandmother/i.test(candidate)) return false;
  const nervous = /緊張|nervous|anxious/i.test(player);
  const upset = /落ち込|ミス|felt.*down|mistake/i.test(player);
  if (nervous && /緊張.*(?:理由|どうして|なぜ)|(?:理由|どうして|なぜ).*緊張|why.*(?:nervous|anxious)|what.*making you.*(?:nervous|anxious)/i.test(candidate)) return false;
  if ((nervous || upset) && /(?:何か|何が|どんなことが)あった|what happened|what.*mistake.*(?:you|make)/i.test(candidate)) return false;
  if (/黙って|質問はいらない|no questions|quietly/i.test(player) && /[?？]|どうして|なぜ/i.test(candidate)) return false;
  return true;
}
