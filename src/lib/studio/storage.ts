import {get,put,BlobPreconditionFailedError} from '@vercel/blob';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {initialLibrary,mutateLibrary,LibraryError,type Library,type Action} from './library';
const path='studio/library-v1.json';
const localFile=join(process.cwd(),'.studio-data/library.json');
const cloud=()=>Boolean(process.env.BLOB_STORE_ID||process.env.BLOB_READ_WRITE_TOKEN);
export async function readLibrary():Promise<{library:Library;etag?:string}>{
 if(cloud()){
  const result=await get(path,{access:'private',useCache:false});
  if(!result)return {library:initialLibrary()};
  return {library:await new Response(result.stream).json(),etag:result.blob.etag};
 }
 if(process.env.NODE_ENV==='production')throw new LibraryError('El almacenamiento del Studio no está conectado.',503);
 try{return {library:JSON.parse(await readFile(localFile,'utf8'))};}
 catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;return {library:initialLibrary()};}
}
// Local requests share a queue; production uses Blob's conditional writes across instances.
let localQueue:Promise<unknown>=Promise.resolve();
export async function writeLibrary(action:Action,revision:number):Promise<Library>{
 const update=async()=>{
  const {library,etag}=await readLibrary();
  if(revision!==library.revision)throw new LibraryError('Hay cambios desde otro dispositivo. Tu borrador sigue guardado en este navegador. Recargá para sincronizar.',409);
  const next=mutateLibrary(library,action),body=JSON.stringify(next);
  if(body.length>3_000_000)throw new LibraryError('La biblioteca llegó a su límite de almacenamiento. No se modificó tu trabajo.',413);
  if(cloud()){
   try{await put(path,body,{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:Boolean(etag),...(etag?{ifMatch:etag}:{} )});}
   catch(error){if(error instanceof BlobPreconditionFailedError||(error instanceof Error&&/already exists/i.test(error.message)))throw new LibraryError('Otro dispositivo guardó cambios. Recargá para sincronizar.',409);throw error;}
  }else{await mkdir(join(process.cwd(),'.studio-data'),{recursive:true});await writeFile(localFile+'.tmp',body);await rename(localFile+'.tmp',localFile);}
  return next;
 };
 if(cloud())return update();
 const result=localQueue.then(update);localQueue=result.catch(()=>{});return result;
}
