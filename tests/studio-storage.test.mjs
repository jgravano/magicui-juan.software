import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as presets from '../public/cuaderno-object/share-preset.js';
import * as model from '../public/cuaderno-object/builder-model.js';
const require=createRequire(import.meta.url);
function compile(path,mocks={}){const exports={};const source=ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(source,{exports,structuredClone,Date,Response,Request,URL,Buffer,process:{cwd:()=>process.cwd(),env:{BLOB_STORE_ID:'test',NODE_ENV:'production'}},require:name=>name in mocks?mocks[name]:require(name)});return exports;}
const library=compile('src/lib/studio/library.ts',{'../../../public/cuaderno-object/share-preset.js':presets,'../../../public/cuaderno-object/builder-model.js':model});
let blob=null,etag=0;
class BlobPreconditionFailedError extends Error{}
const storage=compile('src/lib/studio/storage.ts',{'./library':library,'@vercel/blob':{BlobPreconditionFailedError,async get(){if(!blob)return null;return {stream:new Response(JSON.stringify(blob)).body,blob:{etag:String(etag)}};},async put(path,body,options){await new Promise(r=>setTimeout(r,5));if((options.ifMatch&&options.ifMatch!==String(etag))||(!options.allowOverwrite&&blob))throw new BlobPreconditionFailedError();blob=JSON.parse(body);etag++;}}});
test('two devices cannot overwrite each other, including first save',async()=>{
 const preset=presets.encodePreset(model.defaults);
 const concurrent=await Promise.allSettled([storage.writeLibrary({type:'draft',projectId:'001',preset},0),storage.writeLibrary({type:'rename',projectId:'001',name:'Other tab'},0)]);
 assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(concurrent.find(r=>r.status==='rejected').reason.status,409);
 await assert.rejects(storage.writeLibrary({type:'rename',projectId:'001',name:'Stale tab'},0),e=>e.status===409);
 assert.equal((await storage.readLibrary()).library.projects[0].name,'Cuaderno');
});
let owner=false,writes=0;
const route=compile('src/app/studio/api/library/route.ts',{'@/lib/studio/auth':{isOwner:async()=>owner},'@/lib/studio/library':library,'@/lib/studio/storage':{readLibrary:async()=>({library:library.initialLibrary()}),writeLibrary:async()=>{writes++;return library.initialLibrary();}},'next/cache':{revalidateTag(){}}});
test('library is private and mutations reject cross-origin requests',async()=>{
 assert.equal((await route.GET()).status,401);
 assert.equal((await route.POST(new Request('https://studio.juan.software/studio/api/library',{method:'POST'}))).status,401);
 owner=true;
 const request=origin=>new Request('https://studio.juan.software/studio/api/library',{method:'POST',headers:{host:'studio.juan.software',origin,'Content-Type':'application/json'},body:JSON.stringify({revision:0,action:{type:'publish',projectId:'001',versionId:'original'}})});
 assert.equal((await route.POST(request('https://evil.example'))).status,403);assert.equal(writes,0);
 assert.equal((await route.POST(request('https://studio.juan.software'))).status,200);assert.equal(writes,1);
 assert.match((await route.GET()).headers.get('cache-control'),/private, no-store/);
});
test('new clients rebase simultaneous saves, preserve both drafts and deduplicate retries',async()=>{
 blob=library.initialLibrary();etag=10;
 const base=blob.projects[0].draft.preset;
 const red=presets.encodePreset({...model.defaults,color:'#ff0000'}),green=presets.encodePreset({...model.defaults,color:'#00ff00'});
 const first={type:'draft',projectId:'001',preset:red,baseDraft:base,requestId:'11111111-1111-4111-8111-111111111111'};
 const second={type:'draft',projectId:'001',preset:green,baseDraft:base,requestId:'22222222-2222-4222-8222-222222222222'};
 const results=await Promise.all([storage.writeLibrary(first,0),storage.writeLibrary(second,0)]);
 assert.equal(results.length,2);
 const current=(await storage.readLibrary()).library;
 assert.equal(current.revision,2);
 assert.equal(current.projects[0].draft.preset,green);
 assert.ok(current.projects[0].versions.some(v=>v.preset===red));
 assert.equal(current.published.preset,base);
 const version={type:'version',projectId:'001',preset:green,baseDraft:green,name:'Lista para publicar',requestId:'33333333-3333-4333-8333-333333333333'};
 const saved=await storage.writeLibrary(version,0);
 const retried=await storage.writeLibrary(version,0);
 assert.equal(retried.revision,saved.revision);
 assert.equal(retried.projects[0].versions.length,saved.projects[0].versions.length);
 const published=await storage.writeLibrary({type:'publish',projectId:'001',versionId:saved.projects[0].versions[0].id,requestId:'44444444-4444-4444-8444-444444444444'},0);
 assert.equal(published.published.preset,green);
});
