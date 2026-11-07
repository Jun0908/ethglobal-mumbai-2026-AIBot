import OpenAI from 'openai';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve} from 'node:path';
const dir=resolve(process.env.DEMO_VIDEO_DIR||'output/demo-video','narration');
await mkdir(dir,{recursive:true});
const plan=JSON.parse(await readFile(new URL('./narration.en.json',import.meta.url),'utf8'));
const text=plan.map(s=>s.text).join('\n\n');
if(text.length>4096)throw Error('Speech input exceeds the supported limit');
const exists=async p=>access(p).then(()=>true,()=>false);
const client=new OpenAI({maxRetries:0,timeout:180000});
const model='gpt-4o-mini-tts-2025-12-15',voice='marin';
try{
 const audioPath=dir+'/source-en.wav';
 if(!await exists(audioPath)){
  console.log('Generating one English narration take.');
  const response=await client.audio.speech.create({model,voice,input:text,response_format:'wav',speed:1,instructions:'Read the supplied text exactly in warm, clear, conversational English. This is an explanatory product demo, not a dramatic advertisement. Use a calm and friendly delivery, articulate names naturally, and leave a brief natural pause between paragraphs. Do not add an introduction or any words that are not in the supplied text.'});
  await writeFile(audioPath,Buffer.from(await response.arrayBuffer()));
  await writeFile(dir+'/provenance.json',JSON.stringify({provider:'OpenAI',model,voice,speed:1,input:text,aiGenerated:true},null,2));
  await writeFile(dir+'/spoken-en.txt',text);
  console.log('Original narration saved.');
 }else console.log('Reusing the saved narration take.');
 if(!await exists(dir+'/transcript.json')){
  console.log('Transcribing the saved take for word timing and content verification.');
  const transcript=await client.audio.transcriptions.create({file:createReadStream(audioPath),model:'whisper-1',response_format:'verbose_json',timestamp_granularities:['word','segment'],language:'en'});
  await writeFile(dir+'/transcript.json',JSON.stringify(transcript,null,2));
  console.log('Word timing saved.');
 }
}catch(error){console.error(JSON.stringify({error:'Narration request failed; saved originals are retained and no automatic retry was made.',status:error.status??null,code:error.code??null}));process.exitCode=1;}
