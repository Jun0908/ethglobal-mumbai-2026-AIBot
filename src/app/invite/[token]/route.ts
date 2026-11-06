import { NextRequest,NextResponse } from 'next/server';
import { validateInvitation } from '@/lib/server/invitation-store';
import { loadCapsule } from '@/lib/server/store';
import { requestOrigin } from '@/lib/request-origin';
export const runtime='nodejs';
export async function GET(request:NextRequest,context:{params:Promise<{token:string}>}){
 const {token}=await context.params;const invite=validateInvitation(token);const capsule=invite?await loadCapsule(invite.personaId).catch(()=>null):null;
 const url=new URL('/?invited=1',requestOrigin(request));
 const response=NextResponse.redirect(url);
 if(invite&&capsule?.consent.simulationApproved&&capsule.version===invite.version)response.cookies.set('masala_invite',token,{httpOnly:true,sameSite:'lax',secure:url.protocol==='https:',path:'/',maxAge:7*86400});
 return response;
}
