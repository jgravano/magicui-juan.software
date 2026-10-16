import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../src/proxy.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(mode){const exports={};class NextResponse extends Response{static next(){return new Response(null,{status:200});}}vm.runInNewContext(source,{exports,process:{env:{NODE_ENV:mode}},require:()=>({NextResponse})});return exports;}
test('Studio routes are exclusive to the Studio host in production',()=>{
 const {proxy,config}=load('production');
 assert.deepEqual(Array.from(config.matcher),['/studio/:path*']);
 for(const host of ['www.juan.software','juan.software','preview.vercel.app','localhost:4174','studio.juan.software.evil.test','']){
  const response=proxy({headers:new Headers({host,'x-forwarded-host':'studio.juan.software'})});
  assert.equal(response.status,404,host);assert.equal(response.headers.get('cache-control'),'no-store');
 }
 assert.equal(proxy({headers:new Headers({host:'studio.juan.software'})}).status,200);
});
test('local Studio development remains available without opening other hosts',()=>{
 const {proxy}=load('development');
 for(const host of ['localhost:4174','127.0.0.1:4174'])assert.equal(proxy({headers:new Headers({host})}).status,200);
 assert.equal(proxy({headers:new Headers({host:'www.juan.software'})}).status,404);
});
