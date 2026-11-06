import {test} from 'node:test';
import assert from 'node:assert/strict';
import {personalityItems,personalityChoicesSchema} from '../src/lib/personality-choices';
import {photoPersona,photoSettingsSchema} from '../src/lib/photo-persona';
import {personaContentSchema} from '../src/lib/schemas';

test('every illustrated personality option is valid in Japanese and English without exceeding capsule limits',()=>{
  assert.equal(personalityItems.length,6);
  for(const locale of ['ja','en'] as const){
    for(const item of personalityItems)for(const option of item.options){
      const choices=personalityChoicesSchema.parse({[item.id]:option.id});
      const persona=photoPersona(Array.from({length:6},()=>[0,1]),'natural',locale,choices);
      personaContentSchema.parse(persona);
      assert.equal(persona.behaviorExamples.length,2);
      assert.equal(persona.behaviorExamples[1].response,option.example[locale==='ja'?0:1]);
    }
    const all=personalityChoicesSchema.parse(Object.fromEntries(personalityItems.map(item=>[item.id,item.options[0].id])));
    const persona=photoPersona(Array.from({length:6},()=>[0,1]),'gentle',locale,all);
    persona.behaviorExamples.push({situation:'preview',response:'owner reviewed',tendency:'preview'});
    personaContentSchema.parse(persona);
    assert.equal(persona.behaviorExamples.length,8);
    assert.ok(persona.personality.socialStyle);
    assert.ok(persona.personality.relationshipPace);
    assert.ok(persona.conflictBehavior.repairStyle);
    assert.equal(persona.personality.values.length,14);
  }
});
test('legacy photo profiles keep unknown traits and strict choice validation prevents arbitrary persona instructions',()=>{
  const settings=photoSettingsSchema.parse({choices:[[0],[],[]],voice:'natural'});
  assert.deepEqual(settings.personality,{});
  const original=photoPersona(settings.choices,settings.voice,'en',settings.personality);
  assert.equal(original.personality.socialStyle,null);
  assert.equal(original.personality.relationshipPace,null);
  assert.equal(original.conflictBehavior.repairStyle,null);
  for(const invalid of [{firstMeeting:'anything'},{care:'pause'},{repair:'talk',secret:'instructions'},{planning:7}])assert.equal(personalityChoicesSchema.safeParse(invalid).success,false);
  const pause=photoPersona([[],[],[]],'natural','ja',{repair:'pause',romancePace:'slow',whenClose:'joke'});
  assert.match(pause.conflictBehavior.repairStyle!,/整理/);
  assert.match(pause.personality.relationshipPace!,/ゆっくり/);
  assert.ok(pause.personality.humor);
});
