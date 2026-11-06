import {storyFor, type StoryId,type RomanceState} from './romance-story';

type RecordState = Pick<RomanceState, 'messages' | 'memories'>;
export const dimensions = ['pace', 'activities', 'differences', 'closeness'] as const;
export function romanceVisuals(state: RecordState,story:StoryId='mira') {
  const {beats}=storyFor(story);
  // Deleted or incomplete evidence must never leave a discovery on the map.
  const memories = state.memories.filter(m => state.messages.some(v => v.id === m.playerId) && state.messages.some(v => v.id === m.partnerId));
  const choice = (beat: number) => {
    const memory = memories.find(m => m.beat === beat);
    return memory ? beats[beat].options.findIndex(o => o.label.en === memory.label.en) : -1;
  };
  const friends = choice(11) === 2;
  const milestone = choice(11) >= 0 && !friends ? 3 : choice(10) >= 0 ? 2 : choice(3) >= 0 && choice(3) < 2 ? 1 : 0;
  return {milestone, friends, memories, nodes: dimensions.map(dimension => {
    const evidence = memories.filter(m => m.dimension === dimension);
    const aligned = evidence.some(m => m.observation === 'aligned');
    const different = evidence.some(m => m.observation === 'different');
    // A callback records an actual change of pace/route on the following date.
    const adjusted = evidence.some(m => m.observation === 'different' && (m.beat === 1 || m.beat === 5) && state.messages.some(v => v.role === 'assistant' && v.beat === (m.beat === 1 ? 4 : 8) && v.text.includes(state.messages.find(v => v.id === m.playerId)!.text)));
    const status: 'adjusted'|'mixed'|'aligned'|'different'|'unknown' = adjusted ? 'adjusted' : aligned && different ? 'mixed' : aligned ? 'aligned' : different ? 'different' : 'unknown';
    return {dimension, evidence, status};
  })};
}
