// Exponential damping is monotonic and independent of display refresh rate.
export function smoothZoom(current,target,dt,touch=false,reduced=false){
  if(reduced||Math.abs(target-current)<.0001)return target;
  return current+(target-current)*(-Math.expm1(-(touch?24:12)*Math.max(0,dt)));
}
export function wheelZoom(target,delta,mode=0,pageHeight=800){
  const pixels=delta*(mode===1?16:mode===2?pageHeight:1);
  return Math.max(.65,Math.min(1.65,target*Math.exp(Math.max(-180,Math.min(180,pixels))*.00085)));
}
export function pinchZoom(startZoom,startDistance,distance){
  if(startDistance<=0||distance<=0)return startZoom;
  return Math.max(.65,Math.min(1.65,startZoom*startDistance/distance));
}
// Rounded return around each cover edge; the whole bend stays outside the cover.
export function bandProfile(t,height,bottom,top){
  const edge=1/12,half=height/2,mid=(top+bottom)/2,r=(top-bottom)/2;
  if(t<edge){const a=-Math.PI/2+t/edge*Math.PI;return [half+.045*Math.cos(a),mid+r*Math.sin(a)];}
  if(t>1-edge){const a=Math.PI/2-(t-(1-edge))/edge*Math.PI;return [-half-.045*Math.cos(a),mid+r*Math.sin(a)];}
  return [half-(t-edge)/(1-2*edge)*height,top];
}
