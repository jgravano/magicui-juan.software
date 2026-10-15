import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {isOwner} from '@/lib/studio/auth';
export const dynamic='force-dynamic';
export async function GET(){if(!await isOwner())return new Response('Acceso privado',{status:401,headers:{'Cache-Control':'no-store'}});const html=await readFile(join(process.cwd(),'public/cuaderno-object/index.html'),'utf8');return new Response(html.replace('data-mode="view"','data-mode="studio"').replace('<head>','<head><base href="/cuaderno-object/">'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Frame-Options':'SAMEORIGIN','X-Robots-Tag':'noindex'}});}
