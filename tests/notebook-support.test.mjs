import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,dimensions} from '../public/cuaderno-object/builder-model.js';
import {supportAngle,drapeSheet} from '../public/cuaderno-object/notebook-support.js';
import {stackLayout} from '../public/cuaderno-object/paper-block.js';
import {setPaperSize,stripPositions} from '../public/cuaderno-object/paper-physics.js';

test('the outer cover rests on the desk while the binding keeps its clearance',()=>{
 for(const pageWidth of [90,240])for(const coverThickness of [.025,.12])for(const marginX of [.03,.35])for(const wire of [.012,.035])for(const pages of [32,240]){
  const config={...defaults,pageWidth,coverThickness,marginX,wire,pages};
  const dims=dimensions(config),angle=supportAngle(config,dims);
  const outerBottom=dims.bottom*Math.cos(angle)-(dims.coverWidth+.02)*Math.sin(angle);
  assert.ok(angle>=0&&angle<.12);
  assert.ok(Math.abs(outerBottom-dims.floorZ)<1e-9,'outer edge must meet the desk');
  assert.ok(dims.bottom*Math.cos(angle)>dims.floorZ,'spine side must remain raised');
  assert.ok(dims.bindingBottom>dims.floorZ,'wire must keep its desk clearance');
 }
});

test('draped pages clear both the tilted stack and desk in the steepest support configurations',()=>{
 try{
  for(const pages of [32,240])for(const coverThickness of [.025,.12]){
   const config={...defaults,pageWidth:90,marginX:.03,wire:.035,pages,coverThickness};
   const dims=dimensions(config),angle=supportAngle(config,dims);
   setPaperSize(config.pageWidth/50,config.pageHeight/50);
   for(const page of [1,pages/4,pages/2-1]){
    const layout=stackLayout(config,dims,page);
    for(const [progress,height,blockTop] of [[0,layout.rightTop,layout.rightBlockTop],[1,layout.leftTop,layout.leftBlockTop]]){
     const offset=height-.14,points=drapeSheet(stripPositions(progress),offset,angle);
     for(let i=0;i<points.length;i+=3){
      const z=points[i+2]+offset;
      const stackZ=blockTop/Math.cos(angle)-Math.abs(points[i])*Math.tan(angle);
      assert.ok(z>stackZ+.001,'ink surface cannot be buried by the stack');
      assert.ok(z>dims.floorZ,'sheet cannot pass through the desk');
     }
    }
   }
  }
 }finally{setPaperSize(2.85,4.05);}
});
