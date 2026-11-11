// The rings support the spine; the outer cover edge rests on the desk.
export function supportAngle(_config,dims){
 const outerX=dims.coverWidth+.02;
 const radius=Math.hypot(outerX,dims.bottom);
 const target=Math.max(-1,Math.min(1,dims.floorZ/radius));
 return Math.max(0,Math.min(.12,Math.atan2(dims.bottom,outerX)-Math.asin(target)));
}

// Mutate a fresh sheet buffer before computing normals. Keep the mesh offset
// separate so writing UVs and the existing turn deformation remain unchanged.
export function drapeSheet(positions,offsetZ,angle){
 const cosine=Math.cos(angle),sine=Math.sin(angle);
 for(let i=0;i<positions.length;i+=3){
  const x=positions[i],z=positions[i+2]+offsetZ;
  positions[i]=x*cosine;
  // The free leaf relaxes away from the punched binding, instead of reading
  // as a perfectly rigid plane laid on top of the stack.
  const bindingCurl=.022*Math.exp(-Math.max(0,Math.abs(x)-.095)/.3);
  positions[i+2]=z*cosine-Math.abs(x)*sine-offsetZ+bindingCurl;
 }
 return positions;
}
