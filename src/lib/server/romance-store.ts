import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,unlink,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {encrypt,decrypt} from '../crypto';
import {storageKey} from './store';
import {newRomance,type RomanceState} from '../romance-story';
import type {Locale} from '../i18n';
export const romanceTTL=30*24*60*60*1000;
const directory=()=>resolve('.data/romance');
function path(token:string){if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Invalid token');return join(directory(),createHash('sha256').update(token).digest('hex')+'.json');}
export async function readRomance(token:string,locale:Locale):Promise<RomanceState>{
 try{const raw=JSON.parse(await readFile(path(token),'utf8'));const state=decrypt(raw,await storageKey()) as RomanceState;
 if(state.version!==1 || !Array.isArray(state.messages))throw new Error('Invalid save');
 if(state.updatedAt+romanceTTL<Date.now()){await unlink(path(token));return newRomance(locale);}return state;
 }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return newRomance(locale);throw error;}
}
export async function saveRomance(token:string,state:RomanceState){
 await mkdir(directory(),{recursive:true});const target=path(token),temp=target+'.'+randomUUID()+'.tmp';
 try{await writeFile(temp,JSON.stringify(encrypt(state,await storageKey())),{mode:0o600});await rename(temp,target);}catch(error){await unlink(temp).catch(()=>{});throw error;}
}
export async function removeRomance(token:string){await unlink(path(token)).catch(error=>{if(error.code!=='ENOENT')throw error;});}
let lastSweep=0;
export async function expireRomanceSaves(){
 if(Date.now()-lastSweep<86400000)return;lastSweep=Date.now();
 await mkdir(directory(),{recursive:true});for(const name of await readdir(directory())){if(!/^[a-f0-9]{64}\.json$/.test(name))continue;const file=join(directory(),name);const info=await stat(file);if(info.mtimeMs+romanceTTL<Date.now())await unlink(file);}
}
