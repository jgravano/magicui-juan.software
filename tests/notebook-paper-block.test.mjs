import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../public/cuaderno-object/vendor/three.module.min.js';
import {createPaperBlocks,stackLayout} from '../public/cuaderno-object/paper-block.js';
import {defaults,dimensions} from '../public/cuaderno-object/builder-model.js';
import {setPaperSize,stripPositions} from '../public/cuaderno-object/paper-physics.js';
import {holeLayout} from '../public/cuaderno-object/design-tools.js';
import {drapeSheet,supportAngle} from '../public/cuaderno-object/notebook-support.js';

test('paper blocks stay below the bowed writing surface at every supported thickness',()=>{
 const scene=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 const blocks=createPaperBlocks(scene,material);
 try{
  for(const pages of [32,96,240])for(const coverThickness of [.025,.12])for(const pageHeight of [120,320]){
   const config={...defaults,pages,coverThickness,pageHeight};
   const dims=dimensions(config);
   setPaperSize(config.pageWidth/50,config.pageHeight/50);
   blocks.rebuild(config,dims);
   for(const page of [0,1,pages/4,pages/2-1]){
    const layout=blocks.setPage(page);
    assert.equal(blocks.left.count+blocks.right.count,pages/2,'turning cannot create or lose sheets');
    for(const [mesh,progress,surfaceHeight,blockTop] of [[blocks.left,1,layout.leftTop,layout.leftBlockTop],[blocks.right,0,layout.rightTop,layout.rightBlockTop]]){
     if(!mesh.count)continue;
     const angle=supportAngle(config,dims),offset=surfaceHeight-.14;
     const points=drapeSheet(stripPositions(progress),offset,angle);
     for(let i=0;i<points.length;i+=3){
      const writingZ=points[i+2]+offset;
      const stackZ=blockTop/Math.cos(angle)-Math.abs(points[i])*Math.tan(angle);
      assert.ok(writingZ>stackZ+.001,`paper block occludes writing: ${pages} pages, ${coverThickness} cover, ${pageHeight} height`);
      assert.ok(writingZ>dims.floorZ,'writing must stay above the desk');
     }
     assert.ok(new THREE.Box3().setFromObject(mesh).min.z>dims.floorZ,'stack must stay above the desk');
    }
   }
  }
 }finally{
  blocks.dispose();material.dispose();setPaperSize(2.85,4.05);
 }
});

test('each page turn transfers one leaf and connects the two resting surface heights',()=>{
 for(const pages of [32,96,240])for(const coverThickness of [.025,.12]){
  const config={...defaults,pages,coverThickness},dims=dimensions(config);
  const initial=stackLayout(config,dims,0);
  assert.ok(Math.abs(initial.rightTop-(.128+dims.offset))<1e-9,'full stack must align with closed cover');
  for(let page=0;page<pages/2-1;page++){
   const before=stackLayout(config,dims,page),after=stackLayout(config,dims,page+1);
   assert.equal(after.leftCount,before.leftCount+1);
   assert.equal(after.rightCount,before.rightCount-1);
   assert.ok(after.leftTop>before.leftTop&&after.rightTop<before.rightTop,'mass must visibly change sides');
   for(const progress of [0,.25,.5,.75,1]){
    const turning=stackLayout(config,dims,page,progress);
    assert.equal(turning.leftCount+turning.rightCount+turning.inFlight,pages/2,'flying sheet must not remain in both piles');
    assert.ok(Math.abs(turning.movingFromTop-before.rightTop)<1e-9);
    assert.ok(Math.abs(turning.movingToTop-after.leftTop)<1e-9);
    assert.ok(turning.movingTop>=Math.min(before.rightTop,after.leftTop)-1e-9);
    assert.ok(turning.movingTop<=Math.max(before.rightTop,after.leftTop)+1e-9);
   }
  }
 }
});

test('shared sheet vertices preserve open perforations and the solid paper beside them',()=>{
 const scene=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 const blocks=createPaperBlocks(scene,material);
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,0,-1);
 try{
  for(const holeShape of ['round','oval','square']){
   const config={...defaults,holeShape};
   const dims=dimensions(config),holes=holeLayout(config,dims);
   blocks.rebuild(config,dims);scene.updateMatrixWorld(true);
   const geometry=blocks.right.geometry;
   assert.ok(geometry.attributes.position.count<geometry.index.count*.6,'sheet should share repeated vertices');
   ray.set(new THREE.Vector3(dims.holeX,holes.y[4],1),down);
   assert.equal(ray.intersectObject(blocks.right).length,0,'perforation must remain open');
   ray.set(new THREE.Vector3(dims.holeX+holes.width/2+.02,holes.y[4],1),down);
   assert.ok(ray.intersectObject(blocks.right).length>0,'paper beside perforation must remain solid');
  }
 }finally{blocks.dispose();material.dispose();}
});
