import {NextRequest,NextResponse} from 'next/server';
import {studioOrigin,studioHome,sessionCookie,cookieOptions} from '@/lib/studio/auth';
export async function POST(req:NextRequest){const origin=await studioOrigin();if(req.headers.get('origin')!==origin)return new Response('Forbidden',{status:403});const res=NextResponse.redirect(studioHome(origin),303);res.cookies.set(sessionCookie,'',{...cookieOptions,maxAge:0});return res;}
