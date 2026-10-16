import {isOwner} from '@/lib/studio/auth';
import {notFound} from 'next/navigation';
import {get,head} from '@vercel/blob';
export const dynamic='force-dynamic';
export default async function StorageCheck(){
 if(!await isOwner())notFound();
 const normal=await get('studio/library-v1.json',{access:'private',useCache:false});
 const identity=await get('studio/library-v1.json',{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
 const metadata=await head('studio/library-v1.json');
 return <pre>{JSON.stringify({normal:normal?.blob.etag,identity:identity?.blob.etag,metadata:metadata.etag,revision:normal?(await new Response(normal.stream).json()).revision:null},null,2)}</pre>;
}
