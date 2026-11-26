import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderLoop,renderPixelRatio} from '../public/cuaderno-object/render-loop.js';

function harness(render){
 let next=0;const pending=new Map();
 const loop=createRenderLoop(render,{requestFrame:fn=>{pending.set(++next,fn);return next;},cancelFrame:id=>pending.delete(id)});
 return {loop,pending,step(now){const [id,fn]=pending.entries().next().value;pending.delete(id);fn(now);}};
}
test('input samples coalesce, motion continues, and resting stops all frames',()=>{
 let calls=0,moving=true;const h=harness(()=>{calls++;return moving;});
 for(let i=0;i<20;i++)h.loop.invalidate();
 assert.equal(h.pending.size,1);h.step(100);h.step(117);
 assert.equal(calls,2);assert.equal(h.pending.size,1);
 moving=false;h.step(134);assert.equal(h.pending.size,0);
 h.loop.invalidate();h.step(150);assert.equal(calls,4);assert.equal(h.pending.size,0);
});
test('hidden tabs cancel work and resume without a giant physics step',()=>{
 const times=[];const h=harness((now,dt)=>{times.push(dt);return true;});
 h.loop.invalidate();h.step(100);h.loop.setVisible(false);
 assert.equal(h.pending.size,0);h.loop.invalidate();assert.equal(h.pending.size,0);
 h.loop.setVisible(true);h.step(100000);
 assert.equal(times[1],1/60);h.loop.dispose();assert.equal(h.pending.size,0);
});
test('an invalidation inside a frame is retained and idle wake resets time',()=>{
 const times=[];const h=harness((now,dt)=>{times.push(dt);if(times.length===1)h.loop.invalidate();return false;});
 h.loop.invalidate();h.step(100);assert.equal(h.pending.size,1);h.step(116);
 assert.equal(h.pending.size,0);h.loop.invalidate();h.step(200000);assert.equal(times[2],1/60);
});
test('loading may invalidate without starting a frame before the scene is ready',()=>{
 const pending=[];
 const loop=createRenderLoop(()=>false,{visible:false,requestFrame:fn=>{pending.push(fn);return pending.length;}});
 loop.invalidate();loop.invalidate();assert.equal(pending.length,0);
 loop.setVisible(true);assert.equal(pending.length,1);
});
test('Retina resolution respects density and pixel budget without inflating 1x screens',()=>{
 assert.equal(renderPixelRatio(1440,900,2),1.5);
 assert.equal(renderPixelRatio(1440,900,1),1);
 for(const [w,h,dpr] of [[1728,1117,2],[3024,1964,2],[3840,2160,3],[7680,4320,2],[390,844,3]]){
  const scale=renderPixelRatio(w,h,dpr);assert.ok(scale<=1.5);assert.ok(w*h*scale*scale<=3_000_001);
 }
});
