import {get,head} from '@vercel/blob';
import {revalidateTag} from 'next/cache';
import {isOwner} from '@/lib/studio/auth';
import {readLibrary,writeLibrary} from '@/lib/studio/storage';
import {LibraryError} from '@/lib/studio/library';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'};
function failure(error:unknown){return Response.json({error:error instanceof LibraryError?error.message:'No pudimos conectar con el taller. Tu trabajo queda en este dispositivo.'},{status:error instanceof LibraryError?error.status:503,headers});}
export async function GET(request?:Request){
 if(!await isOwner())return Response.json({error:'Tu sesión terminó. Volvé a entrar con GitHub.'},{status:401,headers});
 try{
  if(request&&new URL(request.url).searchParams.get('diagnostics')==='storage'){
   const normal=await get('studio/library-v1.json',{access:'private',useCache:false});
   const identity=await get('studio/library-v1.json',{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
   const metadata=await head('studio/library-v1.json');
   return Response.json({normal:normal?.blob.etag,identity:identity?.blob.etag,metadata:metadata.etag,revision:normal? (await new Response(normal.stream).json()).revision:null},{headers});
  }
  return Response.json((await readLibrary()).library,{headers});}catch(error){return failure(error);}
}
export async function POST(request:Request){
 if(!await isOwner())return Response.json({error:'Tu sesión terminó. Volvé a entrar con GitHub.'},{status:401,headers});
 const origin=request.headers.get('origin');
 const allowed=process.env.NODE_ENV!=='production'?new URL(request.url).origin:request.headers.get('host')==='studio.juan.software'?'https://studio.juan.software':'https://www.juan.software';
 if(origin!==allowed)return Response.json({error:'Origen no permitido'},{status:403,headers});
 try{
  const text=await request.text();if(text.length>120000)throw new LibraryError('El diseño es demasiado grande.',413);
  const body=JSON.parse(text);
  if(!body||!Number.isSafeInteger(body.revision)||!body.action||typeof body.action!=='object')throw new LibraryError('Solicitud no válida.');
  const library=await writeLibrary(body.action,body.revision);
  if(body.action.type==='publish')revalidateTag('studio-publication',{expire:0});
  return Response.json(library,{headers});
 }catch(error){return failure(error);}
}
