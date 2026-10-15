import {cookies} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import {studioOrigin,studioHome,ownerId,sign,verify,flowCookie,sessionCookie,cookieOptions} from '@/lib/studio/auth';
export async function GET(request:NextRequest){
 const origin=await studioOrigin();
 const flow=verify((await cookies()).get(flowCookie)?.value),code=request.nextUrl.searchParams.get('code'),state=request.nextUrl.searchParams.get('state');
 const reject=(status=403)=>{const res=new NextResponse('No se pudo autorizar el acceso al studio. Volvé a /studio para intentar de nuevo.',{status,headers:{'Cache-Control':'no-store'}});res.cookies.set(flowCookie,'',{...cookieOptions,maxAge:0});return res;};
 if(!flow||flow.kind!=='flow'||flow.state!==state||typeof flow.verifier!=='string'||!code)return reject();
 try{
  const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.STUDIO_GITHUB_CLIENT_ID,client_secret:process.env.STUDIO_GITHUB_CLIENT_SECRET,code,redirect_uri:origin+'/studio/callback',code_verifier:flow.verifier}),cache:'no-store'});
  const token=await tokenResponse.json();if(!tokenResponse.ok||typeof token.access_token!=='string')return reject();
  const userResponse=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${token.access_token}`,Accept:'application/vnd.github+json'},cache:'no-store'});const user=await userResponse.json();if(!userResponse.ok||user.id!==ownerId)return reject();
  const res=NextResponse.redirect(studioHome(origin));res.cookies.set(sessionCookie,sign({kind:'session',id:ownerId,exp:Date.now()+8*3600000}),{...cookieOptions,maxAge:8*3600});res.cookies.set(flowCookie,'',{...cookieOptions,maxAge:0});res.headers.set('Cache-Control','no-store');return res;
 }catch{return reject(502);}
}
