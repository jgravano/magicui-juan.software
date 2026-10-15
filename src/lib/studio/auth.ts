import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
export const studioOrigin='https://www.juan.software';
export const ownerId=100961009;
export const sessionCookie='studio_session';
export const flowCookie='studio_oauth';
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/studio'};
export function configured(){return Boolean(process.env.STUDIO_GITHUB_CLIENT_ID&&process.env.STUDIO_GITHUB_CLIENT_SECRET&&process.env.STUDIO_SESSION_SECRET);}
export function randomToken(){return randomBytes(32).toString('base64url');}
export function sign(data:object){const secret=process.env.STUDIO_SESSION_SECRET;if(!secret)throw Error('Studio authentication is not configured');const body=Buffer.from(JSON.stringify(data)).toString('base64url');return body+'.'+createHmac('sha256',secret).update(body).digest('base64url');}
export function verify(value:string|undefined):Record<string,unknown>|null{try{if(!value||!process.env.STUDIO_SESSION_SECRET)return null;const [body,signature,...extra]=value.split('.');if(extra.length||!body||!signature)return null;const expected=createHmac('sha256',process.env.STUDIO_SESSION_SECRET).update(body).digest();const actual=Buffer.from(signature,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;const data=JSON.parse(Buffer.from(body,'base64url').toString());if(typeof data.exp!=='number'||data.exp<Date.now())return null;return data;}catch{return null;}}
export async function isOwner(){const session=verify((await cookies()).get(sessionCookie)?.value);return session?.id===ownerId&&session?.kind==='session';}
