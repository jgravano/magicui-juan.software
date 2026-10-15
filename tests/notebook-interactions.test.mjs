import test from 'node:test';
import assert from 'node:assert/strict';
import {bandProfile,pinchZoom} from '../public/cuaderno-object/interaction-math.js';
import {defaults,dimensions} from '../public/cuaderno-object/builder-model.js';
test('pinch spreading zooms in, closing zooms out, with bounded distance',()=>{
 assert.equal(pinchZoom(1,100,200),.65);
 assert.equal(pinchZoom(1,100,50),1.65);
 assert.equal(pinchZoom(1,100,125),.8);
 assert.equal(pinchZoom(1,0,0),1);
});
test('elastic stays outside cover volume for all page counts and cover sizes',()=>{
 for(const pages of [32,96,240])for(const coverThickness of [.025,.12])for(const marginY of [.03,.4]){
  const d=dimensions({...defaults,pages,coverThickness,marginY});
  for(let i=0;i<=1000;i++){
   const [y,z]=bandProfile(i/1000,d.coverHeight,d.bottom-.012,d.top+.016);
   assert.ok(Math.abs(y)>=d.coverHeight/2-1e-9||z>d.top||z<d.bottom,`intersection at ${i}`);
   assert.ok(z>d.floorZ,'band must clear table');
  }
  assert.ok(bandProfile(.05,d.coverHeight,d.bottom-.012,d.top+.016)[0]>d.coverHeight/2);
 }
});

test('rendered ribbon segments also clear the cover between vertices',()=>{
 for(const pages of [32,240])for(const coverThickness of [.025,.12]){
  const d=dimensions({...defaults,pages,coverThickness});
  for(let j=0;j<48;j++){
   const a=bandProfile(j/48,d.coverHeight,d.bottom-.012,d.top+.016),b=bandProfile((j+1)/48,d.coverHeight,d.bottom-.012,d.top+.016);
   for(let k=0;k<=100;k++){
    const t=k/100,y=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
    assert.ok(Math.abs(y)>=d.coverHeight/2-1e-9||z>d.top||z<d.bottom);
   }
  }
 }
});
