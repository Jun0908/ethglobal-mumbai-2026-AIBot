import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {encrypt,decrypt} from '../crypto';
import {storageKey} from './store';
import {newCompanion,type CompanionState} from '../companion';
const directory=()=>resolve('.data/companions');
export const companionKey=(owner:string,target:string,version:number)=>createHash('sha256').update(JSON.stringify([owner,target,version])).digest('hex');
const file=(key:string)=>{if(!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid key');return join(directory(),key+'.json');};
export async function readCompanion(key:string):Promise<CompanionState>{try{const s=decrypt(JSON.parse(await readFile(file(key),'utf8')),await storageKey()) as CompanionState;if(s.version!==1||!Array.isArray(s.messages))throw Error('Invalid save');if(s.updatedAt+30*86400000<Date.now()){await unlink(file(key));return newCompanion();}return s;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return newCompanion();throw e;}}
export async function saveCompanion(key:string,s:CompanionState){await mkdir(directory(),{recursive:true});const temp=file(key)+'.'+randomUUID()+'.tmp';try{await writeFile(temp,JSON.stringify(encrypt(s,await storageKey())),{mode:0o600});await rename(temp,file(key));}catch(e){await unlink(temp).catch(()=>{});throw e;}}
