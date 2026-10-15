import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url);
let cookie;
const exports={};
const code=ts.transpileModule(readFileSync(new URL('../src/lib/studio/auth.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{exports,Buffer,Date,process:{env:{STUDIO_SESSION_SECRET:'test-only-session-secret'}},require(name){if(name==='next/headers')return {cookies:async()=>({get:()=>cookie?{value:cookie}:undefined})};return require(name);}});
test('only valid unexpired owner sessions authorize the studio',async()=>{
 const token=exports.sign({kind:'session',id:100961009,exp:Date.now()+60000});cookie=token;assert.equal(await exports.isOwner(),true);
 for(const payload of [{kind:'session',id:1,exp:Date.now()+60000},{kind:'session',id:100961009,exp:Date.now()-1},{kind:'flow',id:100961009,exp:Date.now()+60000}]){cookie=exports.sign(payload);assert.equal(await exports.isOwner(),false);}
 cookie=undefined;assert.equal(await exports.isOwner(),false);
 cookie=token.slice(0,-10)+'aaaaaaaaaa';assert.equal(await exports.isOwner(),false);
 cookie=token+'.extra';assert.equal(await exports.isOwner(),false);
});
