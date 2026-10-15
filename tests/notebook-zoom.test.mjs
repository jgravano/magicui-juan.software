import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothZoom,wheelZoom} from '../public/cuaderno-object/interaction-math.js';
test('zoom converges smoothly without overshoot at different frame rates',()=>{
 const sample=hz=>{let value=1;for(let i=0;i<hz/2;i++){const next=smoothZoom(value,.65,1/hz);assert.ok(next<=value&&next>=.65);value=next;}return value;};
 assert.ok(Math.abs(sample(60)-sample(120))<1e-10);
 assert.ok(Math.abs(sample(60)-.65)<.001);
 assert.ok(smoothZoom(1,.65,1/60)>.9);
 assert.equal(smoothZoom(1,.65,1/60,false,true),.65);
});
test('wheel units normalize and large wheel ticks remain bounded',()=>{
 assert.equal(wheelZoom(1,1,1),wheelZoom(1,16,0));
 assert.equal(wheelZoom(1,10000),wheelZoom(1,180));
 assert.equal(wheelZoom(.65,-10000),.65);
 assert.equal(wheelZoom(1.65,10000),1.65);
});
