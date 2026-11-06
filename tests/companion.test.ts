import {test} from 'node:test';
import assert from 'node:assert/strict';
import {photoPersona} from '../src/lib/photo-persona';
import {newCompanion,dashboardTopics,forgetExchange} from '../src/lib/companion';
test('photos express preferences without inventing personality or biography',()=>{
 const p=photoPersona([[0,1],[],[0]],'natural','en');assert.deepEqual(p.personality.values,['Café','Beach','Photography']);assert.equal(p.personality.socialStyle,null);assert.equal(p.conflictBehavior.repairStyle,null);assert.equal(p.communication.tone,null);assert.equal(photoPersona([[],[],[]],'gentle','ja').behaviorExamples.length,0);
});
test('dashboard growth needs distinct surviving player exchanges; deletion removes dependent plans',()=>{
 let s=newCompanion();s.messages=[{id:'a',role:'user',text:'photo',locale:'en'},{id:'b',role:'assistant',text:'photo',locale:'en'},{id:'c',role:'user',text:'more photos',locale:'en'},{id:'d',role:'assistant',text:'photos',locale:'en'}];s.evidence=[{topic:'photos',userId:'a',partnerId:'b'}];assert.equal(dashboardTopics(s)[0].expanded,false);s.evidence.push({topic:'photos',userId:'c',partnerId:'d'});assert.equal(dashboardTopics(s)[0].expanded,true);s.plans=[{id:'x',places:[0,1],adjustment:0,messageIds:['a','b']}];s=forgetExchange(s,'a');assert.equal(s.plans.length,0);assert.equal(dashboardTopics(s)[0].expanded,false);s=forgetExchange(s,'c');assert.equal(dashboardTopics(s).length,0);
});
