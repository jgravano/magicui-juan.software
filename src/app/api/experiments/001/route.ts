import {unstable_cache} from 'next/cache';
import {readLibrary} from '@/lib/studio/storage';
import {initialLibrary} from '@/lib/studio/library';
export const dynamic='force-dynamic';
const published=unstable_cache(async()=>(await readLibrary()).library.published.preset,['studio-publication-v1'],{tags:['studio-publication'],revalidate:60});
export async function GET(){
 try{const preset=await published();return Response.json({preset},{headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({preset:initialLibrary().published.preset},{headers:{'Cache-Control':'no-store'}});}
}
