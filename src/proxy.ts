import {NextResponse,type NextRequest} from 'next/server';

export function proxy(request:NextRequest){
 const host=(request.headers.get('host')||'').toLowerCase();
 const local=process.env.NODE_ENV==='development'&&/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
 if(host!=='studio.juan.software'&&!local){
  return NextResponse.rewrite(new URL('/_not-found',request.url),{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 }
 return NextResponse.next();
}

// Includes login, callbacks, private canvas and API, not just the Studio page.
export const config={matcher:['/studio/:path*']};
