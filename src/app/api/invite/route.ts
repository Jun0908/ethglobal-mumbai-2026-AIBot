import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { checkOrigin,identity,readBody,ApiError } from '@/lib/server/security';
import { loadCapsule } from '@/lib/server/store';
import { createInvitation,ownerInvitations,revokeInvitation,validateInvitation } from '@/lib/server/invitation-store';
import { requestOrigin } from '@/lib/request-origin';
export const runtime='nodejs';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:NextRequest){
 const token=request.cookies.get('masala_invite')?.value;
 if(token){const invite=validateInvitation(token);if(invite){const capsule=await loadCapsule(invite.personaId).catch(()=>null);if(capsule?.consent.simulationApproved&&capsule.version===invite.version)return json({target:invite.personaId});}}
 return json({target:null});
}
export async function POST(request:NextRequest){try{checkOrigin(request);const person=identity(request);const input=z.discriminatedUnion('op',[z.object({op:z.literal('create'),personaId:z.string().uuid()}).strict(),z.object({op:z.literal('list'),personaId:z.string().uuid()}).strict(),z.object({op:z.literal('revoke'),id:z.string().uuid()}).strict()]).parse(await readBody(request));
 if(input.op==='revoke'){if(!revokeInvitation(input.id,person.ownerId))throw new ApiError(404,'Invite unavailable');return json({revoked:true});}
 const capsule=await loadCapsule(input.personaId).catch(()=>null);if(!capsule||capsule.ownerId!==person.ownerId||!capsule.consent.simulationApproved)throw new ApiError(404,'Persona unavailable');
 if(input.op==='list')return json({invitations:ownerInvitations(person.ownerId,input.personaId)});
 const invitation=createInvitation(person.ownerId,input.personaId,capsule.version);return json({id:invitation.id,url:`${requestOrigin(request)}/invite/${invitation.token}`,expiresAt:invitation.expiresAt});
 }catch(e){return json({error:e instanceof ApiError?e.message:'Could not manage invitation'},e instanceof ApiError?e.status:e instanceof z.ZodError?400:500);}}
