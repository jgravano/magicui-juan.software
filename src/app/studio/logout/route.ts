import {NextRequest,NextResponse} from 'next/server';
import {studioOrigin,sessionCookie,cookieOptions} from '@/lib/studio/auth';
export async function POST(req:NextRequest){if(req.headers.get('origin')!==studioOrigin)return new Response('Forbidden',{status:403});const res=NextResponse.redirect(studioOrigin+'/studio',303);res.cookies.set(sessionCookie,'',{...cookieOptions,maxAge:0});return res;}
