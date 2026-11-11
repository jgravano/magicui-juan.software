import * as THREE from './vendor/three.module.min.js';
import {MM,holeLayout} from './design-tools.js';
import {supportAngle} from './notebook-support.js';

const EDGE_RADIUS=.008;
const LEAF_FILL=.94;
const SURFACE_CLEARANCE=.009;

// Heights are writing-surface bases: add the sheet's small local bow to them.
// During a turn, page is the flying sheet's index and progress runs right→left.
export function stackLayout(config,dims,page,turnProgress=null){
 const totalLeaves=Math.max(1,Math.min(120,Math.round(config.pages/2)));
 const settledPage=Math.max(0,Math.min(totalLeaves-1,Math.trunc(Number(page)||0)));
 const base=-.052+config.coverThickness/2+.002;
 // A full block clears even the downward bow of the printed writing surface.
 const fullBlockTop=.119+dims.offset;
 const leafPitch=Math.max(.0002,(fullBlockTop-base)/totalLeaves);
 const inFlight=Number.isFinite(turnProgress)?1:0;
 const leftCount=settledPage,rightCount=totalLeaves-settledPage-inFlight;
 const leftTop=base+leftCount*leafPitch+SURFACE_CLEARANCE;
 const rightTop=base+rightCount*leafPitch+SURFACE_CLEARANCE;
 const movingFromTop=rightTop+inFlight*leafPitch;
 const movingToTop=leftTop+inFlight*leafPitch;
 const progress=inFlight?Math.max(0,Math.min(1,turnProgress)):0;
 return {
  totalLeaves,page:settledPage,base,leafPitch,leftCount,rightCount,inFlight,
  leftTop,rightTop,
  leftBlockTop:leftCount?base+(leftCount-1+LEAF_FILL)*leafPitch:base,
  rightBlockTop:rightCount?base+(rightCount-1+LEAF_FILL)*leafPitch:base,
  movingFromTop,movingToTop,movingTop:movingFromTop+(movingToTop-movingFromTop)*progress,
 };
}

// Two instanced draws keep individual cut sheets affordable on a tablet.
// Both sides share one fixed leaf pitch; turning transfers sheets, not volume.
export function createPaperBlocks(notebook,material){
 let meshes=[],currentPage=0,currentConfig=null,currentDims=null,layout=null;
 const transform=new THREE.Object3D(),shade=new THREE.Color();

 function rebuild(config,dims){
  clear();
  currentConfig=config;currentDims=dims;
  const initial=stackLayout(config,dims,currentPage);
  const count=initial.totalLeaves;
  const width=config.pageWidth/MM,height=config.pageHeight/MM;
  const {base:bottom,leafPitch:pitch}=initial;
  const holes=holeLayout(config,dims);
  const angle=supportAngle(config,dims),center=width/2+.095;

  for(const side of [-1,1]){
   const geometry=leafGeometry(width,height,side,holes,config.holeShape,dims.holeX);
   const mesh=new THREE.InstancedMesh(geometry,material,count);
   mesh.name=side<0?'left-paper-block':'right-paper-block';
   mesh.userData.paperSide=side;
   mesh.castShadow=mesh.receiveShadow=true;
   mesh.rotation.y=side*angle;
   mesh.position.set(side*center*Math.cos(angle),0,-center*Math.sin(angle));

   for(let i=0;i<count;i++){
    // Under 0.06 mm of cutting variation; never a visibly fanned or worn stack.
    const grain=variation(i+13),cut=variation(i+101);
    const xOffset=side*(cut-.5)*.0012;
    const yOffset=(variation(i+257)-.5)*.0012;
    transform.position.set(xOffset,yOffset,bottom+i*pitch);
    transform.scale.set(1,1,pitch*LEAF_FILL);
    transform.updateMatrix();
    mesh.setMatrixAt(i,transform.matrix);
    shade.setScalar(.98+grain*.02);
    mesh.setColorAt(i,shade);
   }
   mesh.instanceMatrix.needsUpdate=true;
   mesh.instanceColor.needsUpdate=true;
   mesh.computeBoundingBox();
   mesh.computeBoundingSphere();
   notebook.add(mesh);
   meshes.push(mesh);
  }
  return setPage(currentPage);
 }

 function setPage(page,total=Infinity,turnProgress=null){
  currentPage=Math.max(0,Math.min(Number.isFinite(total)?total:Infinity,page));
  if(!currentConfig)return null;
  layout=stackLayout(currentConfig,currentDims,currentPage,turnProgress);
  for(const mesh of meshes){
   const count=mesh.userData.paperSide<0?layout.leftCount:layout.rightCount;
   mesh.visible=count>0;
   if(mesh.count!==count){
    mesh.count=count;
    mesh.computeBoundingBox();mesh.computeBoundingSphere();
   }
  }
  return layout;
 }

 function getHeights(page=currentPage){
  if(!currentConfig)return null;
  const heights=stackLayout(currentConfig,currentDims,page);
  return {left:heights.leftTop,right:heights.rightTop};
 }

 function clear(){
  for(const mesh of meshes){
   notebook.remove(mesh);
   mesh.geometry.dispose();
   mesh.dispose();
  }
  meshes=[];
 }

 return {
  rebuild,setPage,getHeights,
  get layout(){return layout;},
  get left(){return meshes[0];},
  get right(){return meshes[1];},
  get meshes(){return meshes;},
  dispose:clear,
 };
}

function variation(index){
 let n=Math.imul(index^0x9e3779b9,0x85ebca6b);
 n=Math.imul(n^(n>>>13),0xc2b2ae35);
 return ((n^(n>>>16))>>>0)/4294967296;
}

function leafGeometry(width,height,side,layout,holeShape,holeX){
 const x=-width/2,y=-height/2,r=EDGE_RADIUS,shape=new THREE.Shape();
 shape.moveTo(x+r,y);
 shape.lineTo(x+width-r,y);
 shape.quadraticCurveTo(x+width,y,x+width,y+r);
 shape.lineTo(x+width,y+height-r);
 shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
 shape.lineTo(x+r,y+height);
 shape.quadraticCurveTo(x,y+height,x,y+height-r);
 shape.lineTo(x,y+r);
 shape.quadraticCurveTo(x,y,x+r,y);
 const hx=side*(holeX-(width/2+.095));
 const rx=layout.width/2,ry=layout.height/2;
 for(const yy of layout.y){
  const hole=new THREE.Path();
  if(holeShape==='square'){
   hole.moveTo(hx-rx,yy-ry);
   hole.lineTo(hx-rx,yy+ry);
   hole.lineTo(hx+rx,yy+ry);
   hole.lineTo(hx+rx,yy-ry);
   hole.closePath();
  }else hole.absellipse(hx,yy,rx,ry,0,Math.PI*2,true);
  shape.holes.push(hole);
 }
 // Unit depth is scaled per instance; no redundant geometry per sheet.
 return indexLeafGeometry(new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1,curveSegments:8}));
}

// Extrusion repeats every triangle vertex. Share only exact attribute matches:
// cap/wall normals and UV seams remain distinct, so shading does not change.
function indexLeafGeometry(source){
 const attributes=Object.entries(source.attributes),vertices=new Map(),indices=[];
 const values=attributes.map(()=>[]);
 for(let i=0;i<source.attributes.position.count;i++){
  const vertex=attributes.flatMap(([,attribute])=>Array.from(attribute.array.subarray(i*attribute.itemSize,(i+1)*attribute.itemSize)));
  const key=vertex.join(',');
  let index=vertices.get(key);
  if(index===undefined){
   index=vertices.size;
   vertices.set(key,index);
   for(let j=0;j<attributes.length;j++){
    const attribute=attributes[j][1];
    for(let component=0;component<attribute.itemSize;component++)values[j].push(attribute.array[i*attribute.itemSize+component]);
   }
  }
  indices.push(index);
 }
 const geometry=new THREE.BufferGeometry();
 for(let j=0;j<attributes.length;j++){
  const [name,attribute]=attributes[j];
  geometry.setAttribute(name,new THREE.BufferAttribute(new attribute.array.constructor(values[j]),attribute.itemSize,attribute.normalized));
 }
 geometry.setIndex(indices);
 for(const group of source.groups)geometry.addGroup(group.start,group.count,group.materialIndex);
 source.dispose();
 return geometry;
}
